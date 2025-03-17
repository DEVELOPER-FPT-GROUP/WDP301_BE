import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateMediaDto } from '../dto/request/create-media.dto';
import { UpdateMediaDto } from '../dto/request/update-media.dto';
import { MediaResponseDto } from '../dto/response/media-response.dto';

import { ResponseDTO } from 'src/utils/response.dto';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { MediaService } from '../serivce/media.service';

@Controller('media')
@UseInterceptors(LoggingInterceptor)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  //  /**
  //  * 📤 Upload Media File (Base64) & Save to Cloudinary
  //  */
  //  @Post('upload')
  //  async uploadMedia(
  //    @Body() createMediaDto: CreateMediaDto
  //  ): Promise<ResponseDTO<MediaResponseDto>> {
  //    if (!createMediaDto.base64) {
  //      throw new BadRequestException('Base64 string is required for upload');
  //    }
  //    const result = await this.mediaService.uploadMedia(createMediaDto);
  //    return ResponseDTO.success(result, 'Media uploaded successfully');
  //  }

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
}
