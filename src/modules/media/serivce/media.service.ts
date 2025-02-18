import { Injectable, NotFoundException } from '@nestjs/common';
import { MediaResponseDto } from '../dto/response/media-response.dto';
import { MediaMapper } from '../mapper/media.mapper';
import { MediaRepository } from '../repository/media.repository';
import { CreateMediaDto } from '../dto/request/create-media.dto';
import { UpdateMediaDto } from '../dto/request/update-media.dto';
import { winstonLogger as logger } from 'src/common/winston-logger';

@Injectable()
export class MediaService {
  constructor(private readonly mediaRepository: MediaRepository) {}

  /**
   * 📌 Create a new media record
   */
  async createMedia(dto: CreateMediaDto): Promise<MediaResponseDto> {
    logger.http(`Received request to create media for owner ID: ${dto.ownerId}`);
    
    const mediaEntity = MediaMapper.toEntity(dto);
    const media = await this.mediaRepository.create(mediaEntity);
    
    logger.info(`Media created successfully with ID: ${media.mediaId}`);
    return MediaMapper.toResponseDto(media);
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
    console.log("I have been call");
    return MediaMapper.toResponseDto(media);
  }

  /**
   * 📌 Update media by ID
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
   * 📌 Delete media by ID
   */
  async deleteMedia(id: string): Promise<MediaResponseDto> {
    logger.http(`Received request to delete media with ID: ${id}`);

    const deletedMedia = await this.mediaRepository.delete(id);
    if (!deletedMedia) {
      logger.error(`Media with ID: ${id} not found for deletion`);
      throw new NotFoundException(`Media with id ${id} not found`);
    }

    logger.info(`Media deleted successfully with ID: ${id}`);
    return MediaMapper.toResponseDto(deletedMedia);
  }
}
