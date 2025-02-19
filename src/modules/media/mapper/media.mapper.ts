import { Media } from '../schema/media.schema';
import { MediaResponseDto } from '../dto/response/media-response.dto';
import { CreateMediaDto } from '../dto/request/create-media.dto';
import { UpdateMediaDto } from '../dto/request/update-media.dto';
import { v4 as uuidv4 } from 'uuid';
export class MediaMapper {
  /**
   * Converts CreateMediaDto to Media entity for database storage
   */
  static toEntity(dto: CreateMediaDto): Media {
    return {
      mediaId: `MED-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}-${uuidv4().slice(0, 8)}`, 
      ownerId: dto.ownerId, 
      ownerType: dto.ownerType,
      url: dto.url,
      fileName: dto.fileName,
      caption: dto.caption,
      mimeType: dto.mimeType,
      size: dto.size,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Media;
  }

  /**
   * Converts UpdateMediaDto to a Partial<Media> for updating existing media.
   */
  static toUpdateEntity(dto: UpdateMediaDto): Partial<Media> {
    const updateData: Partial<Media> = {};
    
    if (dto.url) updateData.url = dto.url;
    if (dto.fileName) updateData.fileName = dto.fileName;
    if (dto.caption) updateData.caption = dto.caption;
    if (dto.mimeType) updateData.mimeType = dto.mimeType;
    if (dto.size) updateData.size = dto.size;
    
    updateData.updatedAt = new Date(); 
    
    return updateData;
  }

  /**
   * Converts Media entity from database to a MediaResponseDto for API response
   */
  static toResponseDto(media: Media): MediaResponseDto {
    return {
      mediaId: media.mediaId,
      ownerId: media.ownerId.toString(),
      ownerType: media.ownerType,
      url: media.url,
      fileName: media.fileName,
      caption: media.caption,
      mimeType: media.mimeType,
      size: media.size,
      createdAt: media.createdAt,
      updatedAt: media.updatedAt,
    };
  }
}
