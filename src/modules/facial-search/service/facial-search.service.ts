import { Injectable, NotFoundException, BadRequestException, forwardRef, Inject } from '@nestjs/common';
import { FaceEmbeddingRepository } from '../repository/face-embedding.repository';
import { FaceEmbeddingService } from './face-embedding.service';
import { MulterFile } from 'src/common/types/multer-file.type';
import { MediaService } from 'src/modules/media/serivce/media.service';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { MembersRepository } from 'src/modules/members/repository/members.repository';
import { MediaRepository } from 'src/modules/media/repository/media.repository';
import { MemberDTO } from 'src/modules/members/dto/response/member.dto';
import { ConversionUtil } from 'src/utils/conversion.util';
import * as axios from 'axios';

export interface FacialSearchResult {
  memberId: string;
  similarity: number;
  memberDetails?: MemberDTO;
  confidenceLevel?: 'high' | 'medium' | 'low';
}

export interface FacialSearchOptions {
  similarityThreshold?: number;
  maxResults?: number;
  includeDetails?: boolean;
  filterGender?: string;
  filterAgeRange?: [number, number];
  sortBy?: 'similarity' | 'recent' | 'name';
}

@Injectable()
export class FacialSearchService {
  // Default similarity thresholds for different confidence levels
  private readonly HIGH_CONFIDENCE_THRESHOLD = 0.82;
  private readonly MEDIUM_CONFIDENCE_THRESHOLD = 0.72;
  private readonly MIN_CONFIDENCE_THRESHOLD = 0.65;
  
  constructor(
    private readonly faceEmbeddingRepository: FaceEmbeddingRepository,
    private readonly faceEmbeddingService: FaceEmbeddingService,
    private readonly membersRepository: MembersRepository,
    private readonly mediaRepository: MediaRepository,
    @Inject(forwardRef(() => MediaService))
    private readonly mediaService: MediaService,
  ) {}

  /**
   * Generate and store face embedding when a new member avatar is uploaded
   */
  async generateEmbeddingForMember(mediaId: string, memberId: string): Promise<boolean> {
    try {
      logger.info(`Generating face embedding for media ID: ${mediaId}, member ID: ${memberId}`);
      
      // Check if embedding already exists
      const existingEmbedding = await this.faceEmbeddingRepository.findByMediaId(mediaId);
      if (existingEmbedding) {
        logger.info(`Face embedding already exists for media ID: ${mediaId}`);
        return true;
      }
      
      // Get media file details
      const media = await this.mediaRepository.findById(mediaId);
      if (!media) {
        throw new NotFoundException(`Media with id ${mediaId} not found`);
      }
      
      // Download image from Cloudinary or fetch from storage
      const imageBuffer = await this.getMediaBuffer(media.url);
      
      if (!imageBuffer) {
        throw new BadRequestException('Failed to retrieve image data');
      }
      
      // Create a MulterFile-like object
      const file: MulterFile = {
        buffer: imageBuffer,
        originalname: media.fileName,
        mimetype: media.mimeType,
        size: media.size,
        fieldname: 'avatar',
        encoding: '7bit',
      };
      
      // Extract face embedding
      const embeddingResult = await this.faceEmbeddingService.extractFaceEmbedding(file);
      
      if (!embeddingResult.success || !embeddingResult.faceDescriptor) {
        logger.warn(`Could not extract face embedding from media ID: ${mediaId}`);
        return false;
      }
      
      // Store embedding in database
      await this.faceEmbeddingRepository.create({
        memberId: ConversionUtil.toObjectId(memberId),
        mediaId,
        faceDescriptor: Array.from(embeddingResult.faceDescriptor),
      });
      
      logger.info(`✅ Successfully generated and stored face embedding for member ID: ${memberId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Error generating face embedding: ${error.message}`);
      return false;
    }
  }

  /**
   * Search for similar faces across all members with enhanced options and filtering
   */
  async searchFacesByImage(
    file: MulterFile, 
    options: FacialSearchOptions = {}
  ): Promise<FacialSearchResult[]> {
    try {
      const {
        similarityThreshold = this.MIN_CONFIDENCE_THRESHOLD,
        maxResults = 10,
        includeDetails = true,
        filterGender,
        filterAgeRange,
        sortBy = 'similarity'
      } = options;
      
      logger.info(`🔍 Searching for similar faces with threshold: ${similarityThreshold}, options: ${JSON.stringify(options)}`);
      
      // Extract embedding from the uploaded image with enhanced face detection
      const embeddingResult = await this.faceEmbeddingService.extractFaceEmbedding(file);
      
      if (!embeddingResult.success || !embeddingResult.faceDescriptor) {
        throw new BadRequestException('No face detected in the uploaded image');
      }
      
      // Get all stored embeddings
      const allEmbeddings = await this.faceEmbeddingRepository.findAll();
      logger.info(`Comparing against ${allEmbeddings.length} stored face embeddings`);
      
      if (allEmbeddings.length === 0) {
        return [];
      }
      
      // Calculate similarity with each stored embedding using the hybrid algorithm
      const results: FacialSearchResult[] = [];
      const processedMemberIds = new Set<string>();
      
      for (const embedding of allEmbeddings) {
        const memberId = embedding.memberId.toString();
        
        // Skip if we already have a result for this member (to avoid duplicates)
        if (processedMemberIds.has(memberId)) {
          continue;
        }
        
        // Use the improved hybrid similarity calculation
        const similarity = this.faceEmbeddingService.calculateHybridSimilarity(
          embeddingResult.faceDescriptor,
          new Float32Array(embedding.faceDescriptor)
        );
        
        if (similarity >= similarityThreshold) {
          // Determine confidence level based on similarity score
          let confidenceLevel: 'high' | 'medium' | 'low';
          
          if (similarity >= this.HIGH_CONFIDENCE_THRESHOLD) {
            confidenceLevel = 'high';
          } else if (similarity >= this.MEDIUM_CONFIDENCE_THRESHOLD) {
            confidenceLevel = 'medium';
          } else {
            confidenceLevel = 'low';
          }
          
          results.push({
            memberId,
            similarity,
            confidenceLevel
          });
          processedMemberIds.add(memberId);
        }
      }
      
      // Apply any member filtering criteria if needed
      let filteredResults = [...results];
      
      if (filterGender || filterAgeRange) {
        // Get all member IDs from results for batch fetching
        const memberIds = filteredResults.map(result => result.memberId);
        
        // Fetch basic member info for filtering
        const members = await this.membersRepository.findByIds(memberIds);
        const memberMap = new Map(members.map(m => [m._id.toString(), m]));
        
        // Apply filters
        filteredResults = filteredResults.filter(result => {
          const member = memberMap.get(result.memberId);
          if (!member) return false;
          
          // Gender filter
          if (filterGender && member.gender !== filterGender) {
            return false;
          }
          
          // // Age range filter
          // if (filterAgeRange && member.age) {
          //   const [minAge, maxAge] = filterAgeRange;
          //   if (member.age < minAge || member.age > maxAge) {
          //     return false;
          //   }
          // }
          
          return true;
        });
      }
      
      // Sort results based on the sortBy parameter
      switch (sortBy) {
        case 'similarity':
          // Default sorting by similarity (highest first)
          filteredResults.sort((a, b) => b.similarity - a.similarity);
          break;
        case 'recent':
          // For sorting by most recent, need to get member creation dates
          // This would require additional database fetches and sorting by createdAt
          // Implement if needed
          break;
        case 'name':
          // For sorting by name, need to get member names
          // This would require additional database fetches and sorting by name
          // Implement if needed
          break;
      }
      
      // Limit the results
      const limitedResults = filteredResults.slice(0, maxResults);
      
      // If full details are requested, enrich the results with member information
      if (includeDetails) {
        const enrichedResults = await Promise.all(
          limitedResults.map(async (result) => {
            try {
              const member = await this.membersRepository.findById(result.memberId);
              if (member) {
                // Get member media
                const media = await this.mediaRepository.findByOwners(
                  [result.memberId],
                  'Member'
                );
                
                const memberDTO = MemberDTO.map(member);
                return {
                  ...result,
                  memberDetails: {
                    ...memberDTO,
                    media,
                  },
                };
              }
              return result;
            } catch (error) {
              logger.error(`Error fetching member details for ID ${result.memberId}: ${error.message}`);
              return result;
            }
          })
        );
        
        logger.info(`✅ Found ${enrichedResults.length} similar faces with enhanced search`);
        return enrichedResults;
      }
      
      logger.info(`✅ Found ${limitedResults.length} similar faces`);
      return limitedResults;
    } catch (error) {
      logger.error(`❌ Face search error: ${error.message}`);
      throw new BadRequestException(`Face search failed: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for all existing member avatars
   */
  async generateEmbeddingsForAllMembers(): Promise<{ success: number; failed: number }> {
    try {
      logger.info('Generating face embeddings for all members');
      
      // Get all members
      const members = await this.membersRepository.findAll();
      
      let successCount = 0;
      let failedCount = 0;
      
      // Use batching to process members in chunks for better performance
      const BATCH_SIZE = 20;
      for (let i = 0; i < members.length; i += BATCH_SIZE) {
        const memberBatch = members.slice(i, i + BATCH_SIZE);
        
        // Process batch in parallel
        await Promise.all(
          memberBatch.map(async (member) => {
            const memberId = member._id.toString();
            
            // Get member's media
            const mediaList = await this.mediaRepository.findByOwners([memberId], 'Member');
            
            if (!mediaList.length) {
              logger.warn(`No media found for member ID: ${memberId}`);
              return;
            }
            
            // Process each media item
            for (const media of mediaList) {
              const mediaId = media.mediaId.toString();
              const success = await this.generateEmbeddingForMember(mediaId, memberId);
              
              if (success) {
                successCount++;
              } else {
                failedCount++;
              }
            }
          })
        );
        
        logger.info(`Processed batch ${i/BATCH_SIZE + 1}/${Math.ceil(members.length/BATCH_SIZE)}`);
      }
      
      logger.info(`✅ Completed generating embeddings. Success: ${successCount}, Failed: ${failedCount}`);
      return { success: successCount, failed: failedCount };
    } catch (error) {
      logger.error(`❌ Error generating embeddings for all members: ${error.message}`);
      throw new BadRequestException(`Failed to generate embeddings: ${error.message}`);
    }
  }

  /**
   * Store face embedding for a member
   */
  async storeEmbeddingForMember(mediaId: string, memberId: string, faceDescriptor: number[]): Promise<boolean> {
    try {
      logger.info(`🧠 Storing face embedding for media ID: ${mediaId}, member ID: ${memberId}`);

      if (!faceDescriptor || faceDescriptor.length === 0) {
        logger.warn(`⚠️ Empty face descriptor received for media ID: ${mediaId}`);
        return false;
      }

      // Check if an embedding already exists for this media
      const existingEmbedding = await this.faceEmbeddingRepository.findByMediaId(mediaId);
      if (existingEmbedding) {
        logger.info(`🔄 Face embedding already exists for media ID: ${mediaId}, updating instead.`);
        await this.faceEmbeddingRepository.update(mediaId, { faceDescriptor });
      } else {
        // Store new embedding
        await this.faceEmbeddingRepository.create({
          memberId: ConversionUtil.toObjectId(memberId),
          mediaId,
          faceDescriptor,
        });
      }

      logger.info(`✅ Successfully stored face embedding for member ID: ${memberId}`);
      return true;
    } catch (error) {
      logger.error(`❌ Error storing face embedding: ${error.message}`);
      return false;
    }
  }

  /**
   * Find duplicate faces across the database
   * Useful for identifying potential duplicate member profiles
   */
  async findDuplicateFaces(similarityThreshold = 0.8): Promise<{ memberIdA: string; memberIdB: string; similarity: number }[]> {
    try {
      logger.info(`🔍 Searching for duplicate faces with threshold: ${similarityThreshold}`);
      
      // Get all stored embeddings
      const allEmbeddings = await this.faceEmbeddingRepository.findAll();
      
      if (allEmbeddings.length < 2) {
        return [];
      }
      
      const duplicates: { memberIdA: string; memberIdB: string; similarity: number }[] = [];
      const comparedPairs = new Set<string>();
      
      // Compare each embedding with every other embedding
      for (let i = 0; i < allEmbeddings.length; i++) {
        const embedA = allEmbeddings[i];
        const memberIdA = embedA.memberId.toString();
        
        for (let j = i + 1; j < allEmbeddings.length; j++) {
          const embedB = allEmbeddings[j];
          const memberIdB = embedB.memberId.toString();
          
          // Skip if same member or already compared
          if (memberIdA === memberIdB) {
            continue;
          }
          
          // Create a unique key for this pair of members
          const pairKey = [memberIdA, memberIdB].sort().join('|');
          if (comparedPairs.has(pairKey)) {
            continue;
          }
          comparedPairs.add(pairKey);
          
          // Calculate similarity using hybrid method
          const similarity = this.faceEmbeddingService.calculateHybridSimilarity(
            new Float32Array(embedA.faceDescriptor),
            new Float32Array(embedB.faceDescriptor)
          );
          
          if (similarity >= similarityThreshold) {
            duplicates.push({
              memberIdA,
              memberIdB,
              similarity
            });
          }
        }
      }
      
      // Sort by similarity (highest first)
      duplicates.sort((a, b) => b.similarity - a.similarity);
      
      logger.info(`✅ Found ${duplicates.length} potential duplicate faces`);
      return duplicates;
    } catch (error) {
      logger.error(`❌ Error finding duplicate faces: ${error.message}`);
      throw new BadRequestException(`Failed to find duplicate faces: ${error.message}`);
    }
  }

  /**
   * Fetch image buffer from a URL
   */
  async getMediaBuffer(url: string): Promise<Buffer> {
    try {
      logger.http(`Fetching media from URL: ${url}`);
      const response = await axios.default.get(url, {
        responseType: 'arraybuffer',
      });
      
      if (response.status !== 200) {
        throw new BadRequestException(`Failed to fetch image, status: ${response.status}`);
      }
      
      logger.info(`Successfully fetched image from URL: ${url}`);
      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`Error fetching media from URL: ${error.message}`);
      throw new BadRequestException(`Failed to fetch media: ${error.message}`);
    }
  }

  /**
   * Verify if a person in an uploaded image matches a specific member ID
   */
  async verifyFaceAgainstMemberId(file: MulterFile, memberId: string): Promise<{ 
    isMatch: boolean; 
    similarity: number; 
    confidenceLevel: 'high' | 'medium' | 'low' | 'none';
  }> {
    try {
      logger.info(`Verifying face against member ID: ${memberId}`);
      
      // Get member's face embeddings
      const memberEmbeddings = await this.faceEmbeddingRepository.findByMemberId(memberId);
      
      if (!memberEmbeddings.length) {
        logger.warn(`No face embeddings found for member ID: ${memberId}`);
        return { isMatch: false, similarity: 0, confidenceLevel: 'none' };
      }
      
      // Extract embedding from the uploaded image
      const uploadedEmbedding = await this.faceEmbeddingService.extractFaceEmbedding(file);
      
      if (!uploadedEmbedding.success || !uploadedEmbedding.faceDescriptor) {
        logger.warn('No face detected in the uploaded image');
        return { isMatch: false, similarity: 0, confidenceLevel: 'none' };
      }
      
      // Compare uploaded face with all stored faces for the member
      // Keep track of best match
      let bestSimilarity = 0;
      
      for (const embedding of memberEmbeddings) {
        const similarity = this.faceEmbeddingService.calculateHybridSimilarity(
          uploadedEmbedding.faceDescriptor,
          new Float32Array(embedding.faceDescriptor)
        );
        
        if (similarity > bestSimilarity) {
          bestSimilarity = similarity;
        }
      }
      
      // Determine match and confidence level
      let isMatch = false;
      let confidenceLevel: 'high' | 'medium' | 'low' | 'none' = 'none';
      
      if (bestSimilarity >= this.HIGH_CONFIDENCE_THRESHOLD) {
        isMatch = true;
        confidenceLevel = 'high';
      } else if (bestSimilarity >= this.MEDIUM_CONFIDENCE_THRESHOLD) {
        isMatch = true;
        confidenceLevel = 'medium';
      } else if (bestSimilarity >= this.MIN_CONFIDENCE_THRESHOLD) {
        isMatch = true;
        confidenceLevel = 'low';
      }
      
      logger.info(`Face verification result: isMatch=${isMatch}, similarity=${bestSimilarity.toFixed(4)}, confidence=${confidenceLevel}`);
      
      return {
        isMatch,
        similarity: bestSimilarity,
        confidenceLevel
      };
    } catch (error) {
      logger.error(`❌ Error verifying face: ${error.message}`);
      throw new BadRequestException(`Face verification failed: ${error.message}`);
    }
  }
}