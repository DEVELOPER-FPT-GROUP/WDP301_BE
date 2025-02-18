import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors } from '@nestjs/common';
import { CreateMediaDto } from '../dto/request/create-media.dto';
import { UpdateMediaDto } from '../dto/request/update-media.dto';
import { MediaResponseDto } from '../dto/response/media-response.dto';
import { MediaService } from '../serivce/media.service';
import { ResponseDTO } from 'src/utils/response.dto';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';

@Controller('media')
@UseInterceptors(LoggingInterceptor) 
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post()
  async createMedia(@Body() createMediaDto: CreateMediaDto): Promise<ResponseDTO<MediaResponseDto>> {
    const result = await this.mediaService.createMedia(createMediaDto);
    return ResponseDTO.success(result, 'Media created successfully');
  }

  @Get()
  async getAllMedia(): Promise<ResponseDTO<MediaResponseDto[]>> {
    const result = await this.mediaService.getAllMedia();
    return ResponseDTO.success(result, 'Media list fetched successfully');
  }

  @Get(':id')
  async getMediaById(@Param('id') id: string): Promise<ResponseDTO<MediaResponseDto>> {
    const result = await this.mediaService.getMediaById(id);
    return ResponseDTO.success(result, `Media with id ${id} retrieved successfully`);
  }

  // @Get('owner/:ownerId/:ownerType')
  // async getMediaByOwner(
  //   @Param('ownerId') ownerId: string,
  //   @Param('ownerType') ownerType: 'Event' | 'Member'
  // ): Promise<ResponseDTO<MediaResponseDto[]>> {
  //   const result = await this.mediaService.getMediaByOwner(ownerId, ownerType);
  //   return ResponseDTO.success(result, `Media for owner ${ownerId} retrieved successfully`);
  // }

  @Put(':id')
  async updateMedia(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto
  ): Promise<ResponseDTO<MediaResponseDto>> {
    const result = await this.mediaService.updateMedia(id, updateMediaDto);
    return ResponseDTO.success(result, `Media with id ${id} updated successfully`);
  }

  @Delete(':id')
  async deleteMedia(@Param('id') id: string): Promise<ResponseDTO<MediaResponseDto>> {
    const result = await this.mediaService.deleteMedia(id);
    return ResponseDTO.success(result, `Media with id ${id} deleted successfully`);
  }
}
