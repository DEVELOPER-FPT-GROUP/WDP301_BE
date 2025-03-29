import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  UseInterceptors, 
  BadRequestException 
} from '@nestjs/common';

import { UpdateMediaDto } from '../dto/request/update-media.dto';
import { MediaResponseDto } from '../dto/response/media-response.dto';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { ResponseDTO } from 'src/utils/response.dto';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { MediaService } from '../serivce/media.service';

@Controller('media')
@UseInterceptors(LoggingInterceptor)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * 📌 Get all media records
   */
  @Get()
  async getAllMedia(): Promise<ResponseDTO<MediaResponseDto[]>> {
    console.log("calling get all media");
    const result = await this.mediaService.getAllMedia();
    return ResponseDTO.success(result, 'Media list fetched successfully');
  }

  /**
   * 📌 Get media by ID
   */
  @Get(':id')
  async getMediaById(@Param('id') id: string): Promise<ResponseDTO<MediaResponseDto>> {
    const result = await this.mediaService.getMediaById(id);
    return ResponseDTO.success(result, `Media with id ${id} retrieved successfully`);
  }

  /**
   * 📝 Update media metadata (caption, etc.)
   */
  @Put(':id')
  async updateMedia(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto
  ): Promise<ResponseDTO<MediaResponseDto>> {
    const result = await this.mediaService.updateMedia(id, updateMediaDto);
    return ResponseDTO.success(result, `Media with id ${id} updated successfully`);
  }

  /**
   * 🗑 Delete multiple media records
   * @param body.mediaIds - Array of media IDs to delete
   * @returns Success message after deletion
   */
  @Delete('delete-multiple')
  async deleteMultipleMedia(@Body() body: { mediaIds: string[] }): Promise<ResponseDTO<any>> {
    if (!body.mediaIds || body.mediaIds.length === 0) {
      throw new BadRequestException('Media IDs are required for deletion');
    }

    await this.mediaService.deleteMultipleMedia(body.mediaIds);
    return ResponseDTO.success(null, 'Media deleted successfully');
  }

  /**
   * 🗑 Delete Media (Removes from Firebase & DB)
   */
  @Delete(':id')
  async deleteMedia(@Param('id') id: string): Promise<ResponseDTO<MediaResponseDto>> {
    const result = await this.mediaService.deleteMedia(id);
    return ResponseDTO.success(result, `Media with id ${id} deleted successfully`);
  }
  @Post('/verify-upload')
  async verifyUpload(
    @Body() body: { verifiedFaces: { faceId: string; memberId: string; status: 'avatar' | 'label' | 'unknown' }[] }
  ): Promise<MediaResponseDto[]> {
    if (!body.verifiedFaces || !Array.isArray(body.verifiedFaces) || body.verifiedFaces.length === 0) {
      throw new BadRequestException('Invalid request: verifiedFaces must be a non-empty array.');
    }

    logger.http(`📥 Received verified faces: ${JSON.stringify(body.verifiedFaces)}`);

    // ✅ API sẽ trả về sau khi upload thành công, embedding xử lý ngầm
    return await this.mediaService.verifyAndUploadFaces(body.verifiedFaces);
  }

  
}
