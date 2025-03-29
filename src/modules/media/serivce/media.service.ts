import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { MediaResponseDto } from '../dto/response/media-response.dto';
import { MediaMapper } from '../mapper/media.mapper';
import { MediaRepository } from '../repository/media.repository';
import { UpdateMediaDto } from '../dto/request/update-media.dto';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { MediaUploadService } from './media-upload.service';
import { FaceProcessingService } from './face-processing.service';
import { MulterFile } from 'src/common/types/multer-file.type';

@Injectable()
export class MediaService {
  constructor(
    private readonly mediaRepository: MediaRepository,
    private readonly mediaUploadService: MediaUploadService,
    private readonly faceProcessingService: FaceProcessingService,
  ) {}

  async uploadFile(
    file: MulterFile,
    ownerId: string,
    ownerType: 'Event' | 'Member' | 'FamilyHistory',
  ): Promise<MediaResponseDto> {
    return this.mediaUploadService.uploadFile(file, ownerId, ownerType);
  }

  async uploadMultipleFiles(
    files: MulterFile[],
    ownerId: string,
    ownerType: 'Event' | 'Member' | 'FamilyHistory',
  ): Promise<MediaResponseDto[]> {
    return this.mediaUploadService.uploadMultipleFiles(files, ownerId, ownerType);
  }

  async getAllMedia(): Promise<MediaResponseDto[]> {
    const mediaList = await this.mediaRepository.findAll();
    return mediaList.map(MediaMapper.toResponseDto);
  }

  async getMediaById(id: string): Promise<MediaResponseDto> {
    const media = await this.mediaRepository.findById(id);
    if (!media) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }
    return MediaMapper.toResponseDto(media);
  }

  async updateMedia(
    id: string,
    dto: UpdateMediaDto,
  ): Promise<MediaResponseDto> {
    const updateEntity = MediaMapper.toUpdateEntity(dto);
    const updatedMedia = await this.mediaRepository.update(id, updateEntity);

    if (!updatedMedia) {
      throw new NotFoundException(`Media with id ${id} not found`);
    }
    return MediaMapper.toResponseDto(updatedMedia);
  }

  async deleteMedia(id: string): Promise<MediaResponseDto> {
    return this.mediaUploadService.deleteMedia(id);
  }

  async deleteMultipleMedia(mediaIds: string[]): Promise<void> {
    return this.mediaUploadService.deleteMultipleMedia(mediaIds);
  }

  async getMediaByOwners(
    ownerIds: string[],
    ownerType: 'Event' | 'Member' | 'FamilyHistory',
  ): Promise<MediaResponseDto[]> {
    const mediaList = await this.mediaRepository.findByOwners(ownerIds, ownerType);
    return mediaList.map(MediaMapper.toResponseDto);
  }

  async processAndUploadAvatar(
    file: MulterFile,
    ownerId: string,
    ownerType: 'Member'
  ): Promise<{ faceId: string; previewUrl: string; status: 'unknown' }[]> {
    return this.faceProcessingService.processAndUploadAvatar(file, ownerId);
  }

  async verifyAndUploadFaces(
    verifiedFaces: { faceId: string; memberId: string; status: 'avatar' | 'label' | 'unknown' }[]
  ): Promise<MediaResponseDto[]> {
    const result = await this.faceProcessingService.verifyAndProcessFaces(verifiedFaces);
    return result.map(MediaMapper.toResponseDto);
  }

  async deleteUnknownFaces(
    unknownFaces: { faceId: string; memberId: string; status: 'unknown' }[]
  ): Promise<void> {
    return this.mediaUploadService.deleteUnknownFaces(unknownFaces);
  }
}