import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';
import { MediaRepository } from '../repository/media.repository';
import { MediaMapper } from '../mapper/media.mapper';
import { MulterFile } from 'src/common/types/multer-file.type';
import { MediaResponseDto } from '../dto/response/media-response.dto';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { MediaOptions } from '../interfaces/media-options.interface';
import { Media } from '../schema/media.schema';
import * as axios from 'axios';

@Injectable()
export class MediaUploadService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    private readonly mediaRepository: MediaRepository,
  ) {}

  /**
   * Upload a single file to Cloudinary and save record in MongoDB
   * @param file The file to upload
   * @param ownerId The ID of the entity that owns this media
   * @param ownerType The type of entity that owns this media
   * @param options Optional settings for the upload
   * @returns Media response DTO
   */
  async uploadFile(
    file: MulterFile,
    ownerId: string,
    ownerType: 'Event' | 'Member' | 'FamilyHistory',
    options?: MediaOptions
  ): Promise<MediaResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      // Validate file before upload
      this.validateFileForUpload(file, options);

      // Apply any pre-processing to the file if needed
      const processedFile = await this.preprocessFile(file, options);

      // Upload file to Cloudinary with options
      const uploadResult = await this.cloudinaryService.uploadFile(processedFile);

      // Create media entity from upload result
      const mediaEntity = MediaMapper.toEntityFromFile({
        ownerId,
        ownerType,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: uploadResult.secure_url,
        status: ownerType === 'Member' ? options?.upload?.status || 'unknown' : undefined
      });
      

      // Save media metadata to MongoDB
      const media = await this.mediaRepository.create(mediaEntity);
      
      logger.info(`File uploaded successfully: ${media.fileName} (ID: ${media.mediaId})`);
      return MediaMapper.toResponseDto(media);
    } catch (error) {
      logger.error(`Failed to upload file: ${error.message}`);
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to Cloudinary and save records in MongoDB
   * @param files Array of files to upload
   * @param ownerId The ID of the entity that owns this media
   * @param ownerType The type of entity that owns this media
   * @param options Optional settings for the upload
   * @returns Array of Media response DTOs
   */
  async uploadMultipleFiles(
    files: MulterFile[],
    ownerId: string,
    ownerType: 'Event' | 'Member' | 'FamilyHistory',
    options?: MediaOptions
  ): Promise<MediaResponseDto[]> {
    if (!files || !Array.isArray(files) || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    try {
      logger.info(`Uploading ${files.length} files for ${ownerType} ID: ${ownerId}`);
      
      // Process files in parallel batches to avoid overwhelming the Cloudinary API
      const batchSize = options?.processing?.batchSize || 5;
      const allResults: MediaResponseDto[] = [];
      
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        // Process batch in parallel
        const batchPromises = batch.map(file => this.prepareAndUploadFile(file, ownerId, ownerType, options));
        const batchResults = await Promise.all(batchPromises);
        
        allResults.push(...batchResults);
        
        // Add a small delay between batches to avoid overwhelming the service
        if (i + batchSize < files.length) {
          await new Promise(resolve => setTimeout(resolve, options?.processing?.batchDelay || 100));
        }
      }
      
      logger.info(`Successfully uploaded ${allResults.length} files for ${ownerType} ID: ${ownerId}`);
      return allResults;
    } catch (error) {
      logger.error(`Failed to upload multiple files: ${error.message}`);
      throw new BadRequestException(`Error uploading files: ${error.message}`);
    }
  }

  /**
   * Helper method to prepare and upload a single file
   * @private
   */
  private async prepareAndUploadFile(
    file: MulterFile,
    ownerId: string,
    ownerType: 'Event' | 'Member' | 'FamilyHistory',
    options?: MediaOptions
  ): Promise<MediaResponseDto> {
    try {
      // Validate and preprocess file
      this.validateFileForUpload(file, options);
      const processedFile = await this.preprocessFile(file, options);
      
      // Upload to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadFile(processedFile);
      
      // Create and save media entity
      const mediaEntity = MediaMapper.toEntityFromFile({
        ownerId,
        ownerType,
        fileName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        url: uploadResult.secure_url,
        status: ownerType === 'Member' ? options?.upload?.status || 'unknown' : undefined
      });
      
      
      const media = await this.mediaRepository.create(mediaEntity);
      return MediaMapper.toResponseDto(media);
    } catch (error) {
      logger.error(`Error processing file ${file.originalname}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete a media item from Cloudinary and MongoDB
   * @param id ID of the media to delete
   * @returns The deleted media item
   */
  async deleteMedia(id: string): Promise<MediaResponseDto> {
    logger.http(`Deleting media with ID: ${id}`);

    const media = await this.mediaRepository.findById(id);
    if (!media) {
      logger.error(`Media with ID: ${id} not found for deletion`);
      throw new NotFoundException(`Media with id ${id} not found`);
    }

    try {
      // Delete from MongoDB first
      await this.mediaRepository.delete(id);
      
      // Extract public ID from Cloudinary URL
      const publicId = this.cloudinaryService.extractPublicId(media.url);
      
      // Delete from Cloudinary if publicId is extracted
      if (publicId) {
        try {
          await this.cloudinaryService.deleteImage(publicId);
        } catch (cloudinaryError) {
          // Log error but don't fail the operation if Cloudinary deletion fails
          logger.warn(`Failed to delete image from Cloudinary: ${cloudinaryError.message}`);
        }
      }
      
      logger.info(`Media deleted successfully with ID: ${id}`);
      return MediaMapper.toResponseDto(media);
    } catch (error) {
      logger.error(`Error deleting media: ${error.message}`);
      throw new BadRequestException('Failed to delete media');
    }
  }

  /**
   * Delete multiple media items
   * @param mediaIds Array of media IDs to delete
   */
  async deleteMultipleMedia(mediaIds: string[]): Promise<void> {
    if (!mediaIds || mediaIds.length === 0) {
      logger.info('No media IDs provided for deletion');
      return;
    }

    logger.http(`Deleting ${mediaIds.length} media records`);

    try {
      // Fetch all media to be deleted
      const mediaList = await this.mediaRepository.findByIds(mediaIds);
      if (mediaList.length === 0) {
        logger.warn(`No media found for IDs: ${mediaIds.join(', ')}`);
        return;
      }

      // Extract public IDs from URLs for Cloudinary deletion
      const publicIds = mediaList
        .map((media) => this.cloudinaryService.extractPublicId(media.url))
        .filter(Boolean);

      // Delete from Cloudinary (if any valid public IDs)
      if (publicIds.length > 0) {
        await this.cloudinaryService.deleteMultipleFiles(publicIds);
        logger.info(`Deleted ${publicIds.length} files from Cloudinary`);
      }

      // Delete from MongoDB
      await this.mediaRepository.deleteMany(mediaIds);
      logger.info(`Successfully deleted ${mediaList.length} media records from MongoDB`);
    } catch (error) {
      logger.error(`Error deleting multiple media: ${error.message}`);
      throw new BadRequestException(`Failed to delete media: ${error.message}`);
    }
  }

  /**
   * Delete unknown (temporary) faces
   * @param unknownFaces Array of unknown face information
   */
  async deleteUnknownFaces(unknownFaces: { faceId: string; memberId: string; status: 'unknown' }[]): Promise<void> {
    try {
      if (!unknownFaces || unknownFaces.length === 0) {
        logger.info(`No unknown faces found for deletion.`);
        return;
      }

      logger.http(`Deleting ${unknownFaces.length} unknown faces...`);

      // Extract face IDs for deletion from Cloudinary
      const faceIdsToDelete = unknownFaces.map(face => face.faceId);

      // Delete images from Cloudinary
      await this.cloudinaryService.deleteMultipleFilesByFaceIds(faceIdsToDelete);
      logger.info(`Deleted ${unknownFaces.length} unknown faces from Cloudinary.`);

      // Delete records from MongoDB
      await this.mediaRepository.deleteByStatus('unknown', 'Member');
      logger.info(`Successfully removed unknown face records from MongoDB.`);
    } catch (error) {
      logger.error(`Error deleting unknown faces: ${error.message}`);
      throw new BadRequestException(`Failed to delete unknown faces: ${error.message}`);
    }
  }

  /**
   * Download a media item from a URL
   * @param url URL of the media to download
   * @returns Buffer containing the media data
   */
  async downloadMediaFromUrl(url: string): Promise<Buffer> {
    try {
      logger.http(`Downloading media from URL: ${url}`);
      
      const response = await axios.default.get(url, {
        responseType: 'arraybuffer',
        timeout: 10000, // 10 second timeout
      });
      
      if (response.status !== 200) {
        throw new BadRequestException(`Failed to download media, status: ${response.status}`);
      }
      
      logger.info(`Successfully downloaded media from URL: ${url}`);
      return Buffer.from(response.data);
    } catch (error) {
      logger.error(`Error downloading media from URL: ${error.message}`);
      throw new BadRequestException(`Failed to download media: ${error.message}`);
    }
  }

  /**
   * Validate a file before upload
   * @private
   */
  private validateFileForUpload(file: MulterFile, options?: MediaOptions): void {
    // Check file size if limit is specified
    const maxSize = options?.file?.maxSize || 10 * 1024 * 1024; // Default 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds the maximum allowed (${maxSize / (1024 * 1024)}MB)`);
    }
    
    // Check allowed MIME types if specified
    const allowedTypes = options?.file?.allowedTypes || [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp'
    ];
    
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
    }
  }

  /**
   * Preprocess a file before upload (e.g., resize, compress)
   * @private
   */
  private async preprocessFile(file: MulterFile, options?: MediaOptions): Promise<MulterFile> {
    // If no preprocessing is needed, return the original file
    if (!options?.upload?.quality && !options?.upload?.maxWidth && !options?.upload?.maxHeight) {
      return file;
    }
    
    try {
      // Import sharp only when needed to optimize startup time
      const sharp = await import('sharp');
      const image = sharp.default(file.buffer);
      
      // Apply resizing if maxWidth or maxHeight is specified
      if (options?.upload?.maxWidth || options?.upload?.maxHeight) {
        image.resize({
          width: options.upload.maxWidth,
          height: options.upload.maxHeight,
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Apply quality settings if specified
      if (options?.upload?.quality && (file.mimetype === 'image/jpeg' || file.mimetype === 'image/webp')) {
        if (file.mimetype === 'image/jpeg') {
          image.jpeg({ quality: options.upload.quality });
        } else if (file.mimetype === 'image/webp') {
          image.webp({ quality: options.upload.quality });
        }
      }
      
      // Process the image and get the buffer
      const processedBuffer = await image.toBuffer();
      
      // Return a new file object with the processed buffer
      return {
        ...file,
        buffer: processedBuffer,
        size: processedBuffer.length
      };
    } catch (error) {
      logger.warn(`File preprocessing failed, using original file: ${error.message}`);
      return file;
    }
  }
}