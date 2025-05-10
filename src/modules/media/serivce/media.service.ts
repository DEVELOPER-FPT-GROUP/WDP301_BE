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
import { FaceCacheService } from './face-cache.service';
@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly faceDetectionService: FaceDetectionService,
    @Inject(forwardRef(() => FacialSearchService))
    private readonly facialSearchService: FacialSearchService,
    private readonly faceCacheService: FaceCacheService
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
  ): Promise<{ faceId: string; previewUrl: string; status: 'unknown' }[] | MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }
  
    try {
      logger.http(`Processing avatar for ${ownerType} ID: ${ownerId}`);
  
      // Detect faces
      const detectedFaces = await this.faceDetectionService.detectAndCropFaces(file);
  
      if (detectedFaces.length === 0) {
        throw new BadRequestException('No faces detected in the image.');
      }
  
      logger.info(`✅ Detected ${detectedFaces.length} face(s) for ${ownerType} ID: ${ownerId}`);
  
      // ✅ CASE 1: Only one face -> auto save as avatar
      if (detectedFaces.length === 1) {
        const singleFace = detectedFaces[0];
        const newPublicId = `avatar_${ownerId}_${Date.now()}`;
        const uploadResult = await this.cloudinaryService.uploadFile({
          ...file,
          buffer: singleFace.faceBuffer ?? Buffer.alloc(0),
          mimetype: 'image/png',
          originalname: `avatar_${newPublicId}.png`,
        });
  
        // ✅ Step 1: Downgrade current avatar(s) of this member to "label"
        await this.mediaRepository.updateManyByCondition(
          { ownerId, ownerType: 'Member', status: 'avatar' },
          { status: 'label' }
        );
  
        // ✅ Step 2: Save new avatar media
        const mediaEntity = MediaMapper.toEntityFromFile({
          ownerId,
          ownerType: 'Member',
          fileName: `${newPublicId}.png`,
          mimeType: 'image/png',
          size: file.size,
          url: uploadResult.secure_url,
          status: 'avatar'
        });
  
        const saved = await this.mediaRepository.create(mediaEntity);
        logger.info(`✅ Automatically saved avatar for ${ownerId} without manual verification`);
        return MediaMapper.toResponseDto(saved);
      }
  
      // ✅ CASE 2: Multiple faces -> fallback to verification flow
      const tempFaces = await Promise.all(
        detectedFaces.map(async (face, index) => {
          const tempFaceId = `${ownerId}_face_${index}_${Date.now()}`;
          const tempUpload = await this.cloudinaryService.uploadFile({
            ...file,
            buffer: face.faceBuffer ?? Buffer.alloc(0),
            mimetype: 'image/png',
            originalname: `temp_avatar_${tempFaceId}.png`,
          });
  
          if (face.faceBuffer) {
            this.faceCacheService.set(tempUpload.public_id, face.faceBuffer);
          }
  
          return {
            faceId: tempUpload.public_id,
            previewUrl: tempUpload.secure_url,
            status: 'unknown' as const,
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
  
      // 1. Xử lý các face "unknown" → xóa luôn
      const unknownFaces = verifiedFaces
        .filter(face => face.status === 'unknown')
        .map(({ faceId, memberId, status }) => ({
          faceId,
          memberId,
          status: status as 'unknown'
        }));
      if (unknownFaces.length > 0) {
        await this.deleteUnknownFaces(unknownFaces);
      }
  
      // 2. Xác định nếu có face nào là avatar → cập nhật duy nhất
      const avatarFace = verifiedFaces.find(f => f.status === 'avatar');
      if (avatarFace) {
        logger.info(`🎯 Avatar selected by user for member ${avatarFace.memberId}`);
  
        // Downgrade avatar hiện tại (nếu có) → label
        await this.mediaRepository.updateManyByCondition(
          { ownerId: avatarFace.memberId, ownerType: 'Member', status: 'avatar' },
          { status: 'label' }
        );
      }
  
      // 3. Xử lý upload các face được giữ lại
      const facesToProcess = verifiedFaces.filter(
        face => face.status === 'avatar' || face.status === 'label'
      );
  
      if (facesToProcess.length === 0) {
        logger.info('No avatar or label faces to process');
        return [];
      }
  
      const uploadResults = await Promise.all(
        facesToProcess.map(async ({ faceId, memberId, status }) => {
          try {
            const media = await this.processFaceUpload(faceId, memberId, status);
            return media;
          } catch (err) {
            logger.error(`❌ Error processing face ${faceId}: ${err.message}`);
            return null;
          }
        })
      );
  
      const successfulUploads = uploadResults.filter((r): r is Media => r !== null);
  
      logger.info(`✅ Finalized ${successfulUploads.length} face(s)`);
  
      // 4. Background embedding
      if (successfulUploads.length > 0) {
        const embeddingQueue = successfulUploads.map(media => ({
          mediaId: String(media.mediaId),
          memberId: String(media.ownerId),
        }));
  
        setImmediate(() => {
          this.processEmbeddingQueue(embeddingQueue).catch(err => {
            logger.error(`❌ Background embedding error: ${err.message}`);
          });
        });
      }
  
      return successfulUploads.map(MediaMapper.toResponseDto);
    } catch (error) {
      logger.error(`❌ Failed in verifyAndUploadFaces: ${error.message}`);
      throw new BadRequestException(`Failed to finalize face upload: ${error.message}`);
    }
  }
  
  
  private async processFaceUpload(
    faceId: string,
    memberId: string,
    status: 'avatar' | 'label' | 'unknown'
  ): Promise<Media | null> {
    try {
      // ✅ Rename ảnh thay vì re-upload
      const newPublicId = `avatar_${memberId}_${Date.now()}`;
      await this.cloudinaryService.renameFile(faceId, newPublicId);
  
      const finalUrl = this.cloudinaryService.getPublicUrl(newPublicId); // hoặc response.secure_url nếu SDK trả
  
      const mediaEntity = MediaMapper.toEntityFromFile({
        ownerId: memberId,
        ownerType: 'Member',
        fileName: `${newPublicId}.png`,
        mimeType: 'image/png',
        size: 0, // optional nếu không có metadata
        url: finalUrl,
        status
      });
  
      return this.mediaRepository.create(mediaEntity);
    } catch (err) {
      logger.error(`❌ Rename failed for face ${faceId}: ${err.message}`);
      return null;
    }
  }
  
  
  private async processEmbeddingQueue(queue: { mediaId: string; memberId: string }[]): Promise<void> {
    await Promise.allSettled(
      queue.map(async ({ mediaId, memberId }) => {
        try {
          await new Promise(res => setTimeout(res, 100)); // throttle
          await this.facialSearchService.generateEmbeddingForMember(mediaId, memberId);
          logger.info(`✅ Embedded media ${mediaId} for member ${memberId}`);
        } catch (err) {
          logger.warn(`⚠️ Embedding failed for ${mediaId}: ${err.message}`);
        }
      })
    );
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
