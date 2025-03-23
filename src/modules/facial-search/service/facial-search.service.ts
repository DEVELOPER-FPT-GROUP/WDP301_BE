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

export interface FacialSearchResult {
  memberId: string;
  similarity: number;
  memberDetails?: MemberDTO;
}

@Injectable()
export class FacialSearchService {
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
      const imageBuffer = await this.mediaService.getMediaBuffer(media.url);
      
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
   * Search for similar faces across all members
   */
  async searchFacesByImage(file: MulterFile, similarityThreshold = 0.6, maxResults = 10): Promise<FacialSearchResult[]> {
    try {
      logger.info(`🔍 Searching for similar faces with threshold: ${similarityThreshold}`);
      
      // Extract embedding from the uploaded image
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
      
      // Calculate similarity with each stored embedding
      const results: FacialSearchResult[] = [];
      const processedMemberIds = new Set<string>();
      
      for (const embedding of allEmbeddings) {
        const memberId = embedding.memberId.toString();
        
        // Skip if we already have a result for this member (to avoid duplicates)
        if (processedMemberIds.has(memberId)) {
          continue;
        }
        
        const similarity = this.faceEmbeddingService.calculateSimilarity(
          embeddingResult.faceDescriptor,
          new Float32Array(embedding.faceDescriptor)
        );
        
        if (similarity >= similarityThreshold) {
          results.push({
            memberId,
            similarity,
          });
          processedMemberIds.add(memberId);
        }
      }
      
      // Sort by similarity (highest first) and limit results
      const sortedResults = results
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults);
      
      // Fetch member details for each result
      const enrichedResults = await Promise.all(
        sortedResults.map(async (result) => {
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
      
      logger.info(`✅ Found ${enrichedResults.length} similar faces`);
      return enrichedResults;
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
      
      for (const member of members) {
        const memberId = member._id.toString();
        
        // Get member's media
        const mediaList = await this.mediaRepository.findByOwners([memberId], 'Member');
        
        if (!mediaList.length) {
          logger.warn(`No media found for member ID: ${memberId}`);
          continue;
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
      }
      
      logger.info(`✅ Completed generating embeddings. Success: ${successCount}, Failed: ${failedCount}`);
      return { success: successCount, failed: failedCount };
    } catch (error) {
      logger.error(`❌ Error generating embeddings for all members: ${error.message}`);
      throw new BadRequestException(`Failed to generate embeddings: ${error.message}`);
    }
  }
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

}