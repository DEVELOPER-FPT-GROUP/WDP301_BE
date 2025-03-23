import {
  Injectable,
  NotFoundException,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { MediaResponseDto } from '../dto/response/media-response.dto';
import { MediaMapper } from '../mapper/media.mapper';
import { MediaRepository } from '../repository/media.repository';
import { CreateMediaDto } from '../dto/request/create-media.dto';
import { UpdateMediaDto } from '../dto/request/update-media.dto';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { MulterFile } from 'src/common/types/multer-file.type';
import { FaceDetectionService } from 'src/modules/ai-face-detection/service/face-detection.service';

import { FacialSearchService } from 'src/modules/facial-search/service/facial-search.service';
import { Media } from '../schema/media.schema';
import * as axios from 'axios';
@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly faceDetectionService: FaceDetectionService,
    @Inject(forwardRef(() => FacialSearchService))
    private readonly facialSearchService: FacialSearchService
  ) {}

  /**
   * Upload file to Cloudinary and save record in MongoDB
   */
  async uploadFile(
    file: MulterFile,
    ownerId: string,
    ownerType: 'Event' | 'Member' | 'FamilyHistory',
  ): Promise<MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      // Upload file to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadFile(file);

      // Save metadata into MongoDB
      const mediaEntity = MediaMapper.toEntityFromFile({
        ownerId,
        ownerType,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: uploadResult.secure_url,
      });

      const media = await this.mediaRepository.create(mediaEntity);
      return MediaMapper.toResponseDto(media);
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files and store metadata
   */
  async uploadMultipleFiles(
    files: MulterFile[],
    ownerId: string,
    ownerType: 'Event' | 'Member' | 'FamilyHistory',
  ): Promise<MediaResponseDto[]> {
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    try {
      // Upload tất cả file lên Cloudinary song song
      const uploadResults = await Promise.all(
        files.map((file) => this.cloudinaryService.uploadFile(file)),
      );

      // Tạo danh sách media entity từ kết quả upload
      const mediaEntities = uploadResults.map((result, index) => {
        const file = files[index];
        return MediaMapper.toEntityFromFile({
          ownerId,
          ownerType,
          fileName: file.originalname,
          mimeType: file.mimetype,
          size: file.size,
          url: result.secure_url,
        });
      });

      // Lưu tất cả media entity vào MongoDB bằng một lệnh insertMany
      const mediaList = await this.mediaRepository.createMany(mediaEntities);
      return mediaList.map(MediaMapper.toResponseDto);
    } catch (error) {
      logger.error(`Failed to upload multiple files: ${error.message}`);
      throw new BadRequestException(`Error uploading files: ${error.message}`);
    }
  }

  /**
   * Get all media records
   */
  async getAllMedia(): Promise<MediaResponseDto[]> {
    logger.http(`Fetching all media records`);
    const mediaList = await this.mediaRepository.findAll();
    logger.info(`Fetched ${mediaList.length} media records`);
    return mediaList.map(MediaMapper.toResponseDto);
  }

  /**
   * Get media by ID
   */
  async getMediaById(id: string): Promise<MediaResponseDto> {
    logger.http(`Fetching media with ID: ${id}`);
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      logger.warn(`Media with ID: ${id} not found`);
      throw new NotFoundException(`Media with id ${id} not found`);
    }
    logger.info(`Media found with ID: ${id}`);
    return MediaMapper.toResponseDto(media);
  }

  /**
   * Update media by ID
   */
  async updateMedia(
    id: string,
    dto: UpdateMediaDto,
  ): Promise<MediaResponseDto> {
    logger.http(`Received request to update media with ID: ${id}`);
    const updateEntity = MediaMapper.toUpdateEntity(dto);
    const updatedMedia = await this.mediaRepository.update(id, updateEntity);

    if (!updatedMedia) {
      logger.warn(`Media with ID: ${id} not found for update`);
      throw new NotFoundException(`Media with id ${id} not found`);
    }

    logger.info(`Media updated successfully with ID: ${id}`);
    return MediaMapper.toResponseDto(updatedMedia);
  }

  /**
   * Delete media from Cloudinary and MongoDB
   */
  async deleteMedia(id: string): Promise<MediaResponseDto> {
    logger.http(`Received request to delete media with ID: ${id}`);

    const media = await this.mediaRepository.findById(id);
    if (!media) {
      logger.error(`Media with ID: ${id} not found for deletion`);
      throw new NotFoundException(`Media with id ${id} not found`);
    }

    try {
      await this.mediaRepository.delete(id);
      // await this.cloudinaryService.deleteImage(media.fileName);
      logger.info(`Media deleted successfully with ID: ${id}`);
      return MediaMapper.toResponseDto(media);
    } catch (error) {
      logger.error(`Error deleting media: ${error.message}`);
      throw new BadRequestException('Failed to delete media');
    }
  }

  /**
   * Fetch media by multiple owner IDs
   */
  async getMediaByOwners(
    ownerIds: string[],
    ownerType: 'Event' | 'Member' | 'FamilyHistory',
  ): Promise<MediaResponseDto[]> {
    logger.http(`Fetching media for owners: ${ownerIds.join(', ')}`);
    const mediaList = await this.mediaRepository.findByOwners(
      ownerIds,
      ownerType,
    );
    logger.info(
      `Fetched ${mediaList.length} media for owners: ${ownerIds.join(', ')}`,
    );
    return mediaList.map(MediaMapper.toResponseDto);
  }


  

  /**
 * Override the existing processAndUploadAvatar method to also generate face embeddings
 */
  async processAndUploadAvatar(
    file: MulterFile,
    ownerId: string,
    ownerType: 'Member'
  ): Promise<{ faceId: string; previewUrl: string; status: 'unknown' }[]> {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }
  
    try {
      logger.http(`Processing avatar for ${ownerType} ID: ${ownerId}`);
  
      // Detect faces but do not store yet
      const detectedFaces = await this.faceDetectionService.detectAndCropFaces(file);
  
      if (detectedFaces.length === 0) {
        throw new BadRequestException('No faces detected in the image.');
      }
  
      logger.info(`✅ Detected ${detectedFaces.length} face(s) for ${ownerType} ID: ${ownerId}`);
  
      // Temporarily upload each detected face to Cloudinary for preview
      const tempFaces = await Promise.all(
        detectedFaces.map(async (face, index) => {
          const tempFaceId = `${ownerId}_face_${index}_${Date.now()}`;
          const tempUpload = await this.cloudinaryService.uploadFile({
            ...file,
            buffer: face.faceBuffer ?? Buffer.alloc(0),
            mimetype: 'image/png',
            originalname: `temp_avatar_${tempFaceId}.png`,
          });
  
          return {
            faceId: tempUpload.public_id,
            previewUrl: tempUpload.secure_url, // Provide preview image URL for frontend verification
            status: 'unknown' as const, // Default status before user verification
          };
        })
      );
  
      return tempFaces;
    } catch (error) {
      logger.error(`❌ Avatar detection error: ${error.message}`);
      throw new BadRequestException(`Failed to detect avatar: ${error.message}`);
    }
  }
  async verifyAndUploadFaces(
    verifiedFaces: { faceId: string; memberId: string; status: 'avatar' | 'label' | 'unknown' }[]
  ): Promise<MediaResponseDto[]> {
    if (!verifiedFaces || verifiedFaces.length === 0) {
      throw new BadRequestException('No verified faces provided.');
    }
  
    try {
      logger.http(`Finalizing face upload for ${verifiedFaces.length} faces`);
  
      // First, handle all unknown faces deletion separately
      const unknownFaces = verifiedFaces.filter(face => face.status === 'unknown');
      if (unknownFaces.length > 0) {
        await this.deleteUnknownFaces(
          unknownFaces.map(face => ({ faceId: face.faceId, memberId: face.memberId, status: 'unknown' }))
        );
      }
  
      // Get only the faces we want to process further
      const facesToProcess = verifiedFaces.filter(face => face.status === 'avatar' || face.status === 'label');
      if (facesToProcess.length === 0) {
        logger.info('No avatar or label faces to process');
        return [];
      }
      
      // Process all faces first - store results for later
      const uploadResults: Media[] = [];
      
      for (const { faceId, memberId, status } of facesToProcess) {
        // Retrieve temporary uploaded face file from Cloudinary
        const tempFile = await this.cloudinaryService.getExistingFile(faceId);
  
        if (!tempFile) {
          logger.warn(`Temporary file for face ID ${faceId} not found, skipping`);
          continue;
        }
  
        try {
          // Download the image from Cloudinary using axios directly
          const response = await axios.default.get(tempFile.url, {
            responseType: 'arraybuffer',
          });
          
          if (response.status !== 200) {
            logger.warn(`Failed to fetch image for face ID ${faceId}, skipping`);
            continue;
          }
          
          const imageBuffer = Buffer.from(response.data);
  
          // Upload final version to Cloudinary
          const finalUpload = await this.cloudinaryService.uploadFile({
            fieldname: 'file',
            encoding: '7bit',
            mimetype: 'image/png',
            buffer: imageBuffer,
            originalname: `avatar_${memberId}.png`,
            size: tempFile.size
          });
  
          // Store in MongoDB
          const mediaEntity = MediaMapper.toEntityFromFile({
            ownerId: memberId,
            ownerType: 'Member',
            fileName: `avatar_${memberId}.png`,
            mimeType: 'image/png',
            size: tempFile.size,
            url: finalUpload.secure_url,
            status: status
          });
  
          const savedMedia = await this.mediaRepository.create(mediaEntity);
          uploadResults.push(savedMedia);
        } catch (error) {
          logger.error(`Error processing face ID ${faceId}: ${error.message}`);
          // Continue with next face
        }
      }
  
      // At this point, face upload is complete regardless of embedding generation
      logger.info(`✅ Successfully finalized ${uploadResults.length} avatar(s) and labeled face(s)`);
      
      // IMPORTANT: Schedule embedding generation to happen outside this function's stack
      if (uploadResults.length > 0) {
        const embeddingQueue = uploadResults.map(media => ({
          mediaId: String(media.mediaId),
          memberId: String(media.ownerId)
        }));
        
        // Use setTimeout with 0ms delay to push to next event loop iteration
        setTimeout(() => {
          this.processEmbeddingQueue(embeddingQueue).catch(err => {
            logger.error(`Background embedding generation failed: ${err.message}`);
          });
        }, 0);
      }
  
      return uploadResults.map(media => MediaMapper.toResponseDto(media));
    } catch (error) {
      logger.error(`❌ Error finalizing face upload: ${error.message}`);
      throw new BadRequestException(`Failed to finalize face upload: ${error.message}`);
    }
  }
  
  // New helper method to process embedding queue
  private async processEmbeddingQueue(queue: { mediaId: string; memberId: string }[]): Promise<void> {
    for (const { mediaId, memberId } of queue) {
      try {
        // Add a slight delay between processing each item to avoid overloading
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await this.facialSearchService.generateEmbeddingForMember(mediaId, memberId);
        logger.info(`✅ Successfully generated embedding for media ${mediaId}, member ${memberId}`);
      } catch (error) {
        logger.warn(`⚠️ Failed to generate embedding for media ${mediaId}: ${error.message}`);
      }
    }
  }

  
  async deleteUnknownFaces(unknownFaces: { faceId: string; memberId: string; status: 'unknown' }[]): Promise<void> {
    try {
      if (!unknownFaces || unknownFaces.length === 0) {
        logger.info(`✅ No unknown faces found for deletion.`);
        return;
      }
  
      logger.http(`🔍 Deleting ${unknownFaces.length} unknown faces...`);
  
      // Extract face IDs for deletion from Cloudinary
      const faceIdsToDelete = unknownFaces.map(face => face.faceId);
  
      // Delete images from Cloudinary
      await this.cloudinaryService.deleteMultipleFilesByFaceIds(faceIdsToDelete);
      logger.info(`🗑️ Deleted ${unknownFaces.length} unknown faces from Cloudinary.`);
  
      // Delete records from MongoDB
      await this.mediaRepository.deleteByStatus('unknown', 'Member');
      logger.info(`✅ Successfully removed ${unknownFaces.length} unknown face records from MongoDB.`);
    } catch (error) {
      logger.error(`❌ Error deleting unknown faces: ${error.message}`);
      throw new BadRequestException(`Failed to delete unknown faces: ${error.message}`);
    }
  }
  
  
  /**
   * Delete multiple media records by IDs
   */
  async deleteMultipleMedia(mediaIds: string[]): Promise<void> {
    if (!mediaIds || mediaIds.length === 0) {
      logger.info('No media IDs provided for deletion');
      return;
    }

    logger.http(`Received request to delete ${mediaIds.length} media records`);

    try {
      const mediaList = await this.mediaRepository.findByIds(mediaIds);
      if (mediaList.length === 0) {
        logger.warn(`No media found for IDs: ${mediaIds.join(', ')}`);
        return;
      }

      // Extract public IDs from URLs
      const publicIds = mediaList
        .map((media) => this.cloudinaryService.extractPublicId(media.url))
        .filter(Boolean);

      // Delete from Cloudinary
      if (publicIds.length > 0) {
        await this.cloudinaryService.deleteMultipleFiles(publicIds); // Or use deleteMultipleFilesBulk
        logger.info(`Deleted ${publicIds.length} files from Cloudinary`);
      }

      // Delete from MongoDB
      await this.mediaRepository.deleteMany(mediaIds);
      logger.info(
        `Successfully deleted ${mediaList.length} media records from MongoDB`,
      );
    } catch (error) {
      logger.error(`Error deleting multiple media: ${error.message}`);
      throw new BadRequestException(`Failed to delete media: ${error.message}`);
    }
  }
}
