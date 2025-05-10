import { Controller, Get, Post, Patch, Delete, Param, Body, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { EventsService } from '../service/events.service';
import { CreateEventDto } from '../dto/request/create-event.dto';
import { UpdateEventDto } from '../dto/request/update-event.dto';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ParseFilePipeBuilder, HttpStatus } from '@nestjs/common';
import { MulterFile } from 'src/common/types/multer-file.type';
import { EventResponse } from '../dto/response/events.dto';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { ResponseDTO } from 'src/utils/response.dto';

@Controller('events')
@UseInterceptors(LoggingInterceptor)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
  async create(
    @Body() createEventDto: CreateEventDto,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: false, // Files are optional
        })
    ) files: { files?: MulterFile[] }
  ): Promise<ResponseDTO<EventResponse>> {
    logger.info('[Handler] Create Event called');
    const event = await this.eventsService.createEvent(createEventDto, files?.files || []);
    return ResponseDTO.success(event, 'Event created successfully');
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ResponseDTO<EventResponse>> {
    logger.info(`[Handler] Fetch Event: ${id}`);
    const event = await this.eventsService.getEventById(id);
    return ResponseDTO.success(event, 'Event fetched successfully');
  }

  @Patch(':id')
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: false, // Files are optional
        })
    ) files: { files?: MulterFile[] }
  ): Promise<ResponseDTO<EventResponse>> {
    logger.info(`[Handler] Update Event: ${id}`);
    const event = await this.eventsService.updateEvent(id, updateEventDto, files?.files || []);
    return ResponseDTO.success(event, 'Event updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ResponseDTO<boolean>> {
    logger.info(`[Handler] Delete Event: ${id}`);
    const result = await this.eventsService.deleteEvent(id);
    return ResponseDTO.success(result, 'Event deleted successfully');
  }
}