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
import { FaceImageDto } from '../dto/response/face-respone.dto';

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

  async detectAndUploadFaces(
    file: MulterFile,
    ownerId: string,
  ): Promise<FaceImageDto[]> {
    // Gọi service detect khuôn mặt và upload ảnh khuôn mặt
    return this.faceProcessingService.detectAndUploadFaces(file, ownerId);
  }
  
  async embedFacesInBackground(faceImages: FaceImageDto[]): Promise<void> {
    // ❌ Không dùng embedAsync nữa — dùng trực tiếp logic nền
    if (!faceImages || faceImages.length === 0) return;
  
    const queue: { mediaId: string; memberId: string }[] = [];
  
    for (const face of faceImages) {
      const media = await this.faceProcessingService.getMediaById(face.faceId);
      if (media?.ownerId) {
        queue.push({
          mediaId: face.faceId,
          memberId: String(media.ownerId),
        });
      }
    }
  
    if (queue.length === 0) {
      logger.warn('⛔ Không có khuôn mặt hợp lệ để xử lý embedding nền');
      return;
    }
  
    // Thêm vào hàng đợi nền
    this.faceProcessingService.enqueueEmbedding(queue);
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