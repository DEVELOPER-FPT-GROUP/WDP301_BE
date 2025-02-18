import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { MediaResponseDto } from '../dto/response/media-response.dto';
import { MediaMapper } from '../mapper/media.mapper';
import { MediaRepository } from '../repository/media.repository';
import { CreateMediaDto } from '../dto/request/create-media.dto';
import { UpdateMediaDto } from '../dto/request/update-media.dto';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { CloudinaryService } from 'src/modules/cloudinary/cloudinary.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * 📌 Upload media file to Cloudinary and save record in MongoDB
   */
  async uploadMedia(file: Express.Multer.File, dto: CreateMediaDto): Promise<MediaResponseDto> {
    logger.http(`Received request to upload media for owner ID: ${dto.ownerId}`);

    if (!file) {
      throw new BadRequestException('File is required');
    }

    try {
      // 📤 Upload file to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadImage(file);
      
      // Save to MongoDB
      const mediaEntity = MediaMapper.toEntity(dto);
      mediaEntity.url = uploadResult.secure_url;
      mediaEntity.fileName = file.originalname;
      mediaEntity.mimeType = file.mimetype;
      mediaEntity.size = file.size;
  
      const media = await this.mediaRepository.create(mediaEntity);
      logger.info(`Media uploaded successfully with ID: ${media.mediaId}`);
  
      return MediaMapper.toResponseDto(media);
    } catch (error) {
      logger.error(`Error uploading file to Cloudinary: ${error.message}`);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /**
   * 📌 Get all media records
   */
  async getAllMedia(): Promise<MediaResponseDto[]> {
    logger.http(`Fetching all media records`);
    const mediaList = await this.mediaRepository.findAll();
    logger.info(`Fetched ${mediaList.length} media records`);
    return mediaList.map(MediaMapper.toResponseDto);
  }

  /**
   * 📌 Get media by ID
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
   * 📌 Update media by ID (only caption or metadata, not file)
   */
  async updateMedia(id: string, dto: UpdateMediaDto): Promise<MediaResponseDto> {
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
   * 📌 Delete media from Cloudinary and MongoDB
   */
  async deleteMedia(id: string): Promise<MediaResponseDto> {
    logger.http(`Received request to delete media with ID: ${id}`);
    
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      logger.error(`Media with ID: ${id} not found for deletion`);
      throw new NotFoundException(`Media with id ${id} not found`);
    }

    try {
      // Extract public_id from Cloudinary URL
      const publicId = this.cloudinaryService.extractPublicId(media.url);
      
      // 🗑 Delete file from Cloudinary
      await this.cloudinaryService.deleteImage(publicId);

      // Delete record from MongoDB
      await this.mediaRepository.delete(id);
      
      logger.info(`Media deleted successfully with ID: ${id}`);
      return MediaMapper.toResponseDto(media);
    } catch (error) {
      logger.error(`Error deleting file from Cloudinary: ${error.message}`);
      throw new BadRequestException('Failed to delete media');
    }
  }
}
