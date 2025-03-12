import {
  Injectable,
  NotFoundException,
  BadRequestException,
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

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly faceDetectionService: FaceDetectionService,
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
   * Process avatar image, detect face, crop, and upload to Cloudinary
   */
  async processAndUploadAvatar(
    file: MulterFile,
    ownerId: string,
    ownerType: 'Member',
  ): Promise<MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    try {
      logger.http(`Processing avatar for ${ownerType} with ID: ${ownerId}`);

      // Detect and crop face
      const faceDetectionResult =
        await this.faceDetectionService.detectAndCropFace(file);
      if (!faceDetectionResult.success || !faceDetectionResult.faceBuffer) {
        throw new BadRequestException(
          faceDetectionResult.message || 'Face detection failed',
        );
      }

      // Upload processed avatar to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadFile({
        ...file,
        buffer: faceDetectionResult.faceBuffer,
        mimetype: 'image/png',
        originalname: file.originalname.replace(/\.\w+$/, '.png'),
      });

      // Save metadata in MongoDB
      const mediaEntity = MediaMapper.toEntityFromFile({
        ownerId,
        ownerType,
        fileName: uploadResult.originalname,
        mimeType: 'image/png',
        size: file.size,
        url: uploadResult.secure_url,
      });

      const media = await this.mediaRepository.create(mediaEntity);
      logger.info(
        `✅ Avatar processed and uploaded successfully for ${ownerType} ID: ${ownerId}`,
      );
      return MediaMapper.toResponseDto(media);
    } catch (error) {
      logger.error(`❌ Avatar processing error: ${error.message}`);
      throw new BadRequestException(
        `Failed to process avatar: ${error.message}`,
      );
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
