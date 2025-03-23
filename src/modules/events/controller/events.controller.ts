import { 
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, 
  UseInterceptors, UploadedFiles, Req 
} from '@nestjs/common';
import { Request } from 'express';
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
import { JwtAuthGuard } from 'src/modules/auth/guard/jwt-auth.guard';
import { RolesGuard, UserRole } from 'src/modules/auth/guard/roles.guard';
import { Roles } from 'src/modules/auth/decorator/roles.decorator';

@Controller('events')
@UseInterceptors(LoggingInterceptor)
@UseGuards(JwtAuthGuard, RolesGuard) // First authenticate, then check roles
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @Roles(UserRole.MEMBER, UserRole.HOUSEHOLD_HEAD, UserRole.BRANCH_HEAD, UserRole.FAMILY_HEAD)
  @UseInterceptors(FileFieldsInterceptor([{ name: 'files', maxCount: 10 }]))
  async create(
    @Body() createEventDto: CreateEventDto,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .build({
          errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          fileIsRequired: false, // Files are optional
        })
    ) files: { files?: MulterFile[] },
    @Req() req: Request
  ): Promise<ResponseDTO<EventResponse>> {
    logger.info('[Handler] Create Event called');
    const user = req.user;
    const event = await this.eventsService.createEvent(createEventDto, files?.files || [], user);
    return ResponseDTO.success(event, 'Event created successfully');
  }

  @Get(':id')
  @Roles(UserRole.MEMBER, UserRole.HOUSEHOLD_HEAD, UserRole.BRANCH_HEAD, UserRole.FAMILY_HEAD)
  async findOne(@Param('id') id: string, @Req() req: Request): Promise<ResponseDTO<EventResponse>> {
    logger.info(`[Handler] Fetch Event: ${id}`);
    const user = req.user; // Extract user
    const event = await this.eventsService.getEventById(id); // Pass user for RBAC
    return ResponseDTO.success(event, 'Event fetched successfully');
  }
  

  @Patch(':id')
  @Roles(UserRole.MEMBER, UserRole.HOUSEHOLD_HEAD, UserRole.BRANCH_HEAD, UserRole.FAMILY_HEAD)
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
    ) files: { files?: MulterFile[] },
    @Req() req: Request
  ): Promise<ResponseDTO<EventResponse>> {
    logger.info(`[Handler] Update Event: ${id}`);
    const user = req.user;
    const event = await this.eventsService.updateEvent(id, updateEventDto, files?.files || [], user);
    return ResponseDTO.success(event, 'Event updated successfully');
  }

  @Delete(':id')
  @Roles(UserRole.MEMBER, UserRole.HOUSEHOLD_HEAD, UserRole.BRANCH_HEAD, UserRole.FAMILY_HEAD)
  async remove(@Param('id') id: string, @Req() req: Request): Promise<ResponseDTO<boolean>> {
    logger.info(`[Handler] Delete Event: ${id}`);
    const user = req.user;
    const result = await this.eventsService.deleteEvent(id, user);
    return ResponseDTO.success(result, 'Event deleted successfully');
  }
}
