import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateEventDto } from '../dto/request/create-event.dto';
import { UpdateEventDto } from '../dto/request/update-event.dto';
import { IEventService } from './events.service.interface';
import { EventsRepository } from '../repository/events.repository';
import { EventResponse } from '../dto/response/events.dto';
import { MulterFile } from 'src/common/types/multer-file.type';
import { MediaResponseDto } from 'src/modules/media/dto/response/media-response.dto';
import { EventMapper } from '../mapper/events.mapper';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { MediaService } from 'src/modules/media/serivce/media.service';
import { UserRole } from 'src/modules/auth/guard/roles.guard';


@Injectable()
export class EventsService implements IEventService {
  constructor(
    private readonly eventsRepository: EventsRepository,
    private readonly mediaService: MediaService,
  ) {}

  async getEventById(id: string): Promise<EventResponse> {
    logger.http(`Received request to get event with ID: ${id}`);
    const event = await this.eventsRepository.findById(id);
    if (!event) {
      logger.error(`Event with ID: ${id} not found`);
      throw new NotFoundException('Event not found');
    }
    const mediaList = await this.mediaService.getMediaByOwners([id], 'Event');
    logger.info(`Event with ID: ${id} retrieved successfully`);
    return { event: EventMapper.toResponseDto(event, mediaList) };
  }

  async createEvent(data: CreateEventDto, files: MulterFile[], user): Promise<EventResponse> {
    logger.http('Received request to create a new event');

    // Prevent Super Admin from creating events
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin is not allowed to create events.');
    }

    const eventEntity = EventMapper.toEntity(data);
    eventEntity.createdBy = user.userId;

    const createdEvent = await this.eventsRepository.create(eventEntity);
    let mediaList: MediaResponseDto[] = [];

    if (files && files.length > 0) {
      mediaList = await this.mediaService.uploadMultipleFiles(files, createdEvent.eventId, 'Event');
    }

    logger.info(`Event created successfully with ID: ${createdEvent.eventId}`);
    return { event: EventMapper.toResponseDto(createdEvent, mediaList) };
  }

  async updateEvent(id: string, updateData: UpdateEventDto, files: MulterFile[], user): Promise<EventResponse> {
    logger.http(`Received request to update event with ID: ${id}`);

    // Prevent Super Admin from updating events
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin is not allowed to update events.');
    }

    // Check if event exists
    const event = await this.eventsRepository.findById(id);
    if (!event) {
      logger.error(`Event with ID: ${id} not found`);
      throw new NotFoundException('Event not found');
    }

    // Fetch existing media for consistency
    let existingMedia = await this.mediaService.getMediaByOwners([id], 'Event');
    let mediaList: MediaResponseDto[] = [];

    // Ensure deleteImageIds is always an array
    const deleteImageIds = updateData.deleteImageIds ?? [];

    // Handle media deletion if requested
    if (updateData.isChangeImage && deleteImageIds.length > 0) {
      logger.info(`Deleting ${deleteImageIds.length} media files for event ID: ${id}`);
      await Promise.all(deleteImageIds.map(imageId => this.mediaService.deleteMedia(imageId)));

      // Update existingMedia after deletion
      existingMedia = existingMedia.filter(media => !deleteImageIds.includes(media.mediaId));
    }

    // Handle new file uploads
    if (files.length > 0) {
      logger.info(`Uploading ${files.length} new media files for event ID: ${id}`);
      const uploadedFiles = await this.mediaService.uploadMultipleFiles(files, id, 'Event');

      if (updateData.isChangeImage) {
        mediaList = uploadedFiles;
      } else {
        const allMedia = [...existingMedia, ...uploadedFiles];
        const mediaMap = new Map<string, MediaResponseDto>();

        allMedia.forEach(media => {
          if (media.url) {
            mediaMap.set(media.url, media);
          }
        });

        mediaList = Array.from(mediaMap.values());
      }
    } else {
      mediaList = updateData.isChangeImage ? existingMedia : existingMedia;
    }

    // Update event data
    const updateEntity = EventMapper.toUpdateEntity(updateData);
    logger.debug(`Updating event ID: ${id} with data: ${JSON.stringify(updateEntity)}`);

    const updatedEvent = await this.eventsRepository.update(id, updateEntity);
    if (!updatedEvent) {
      logger.error(`Event with ID: ${id} not found for update`);
      throw new NotFoundException('Event not found');
    }

    logger.info(`Event with ID: ${id} updated successfully`);
    return { event: EventMapper.toResponseDto(updatedEvent, mediaList) };
}


  async deleteEvent(id: string, user): Promise<boolean> {
    logger.http(`Received request to delete event with ID: ${id}`);

    // Prevent Super Admin from deleting events
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Super Admin is not allowed to delete events.');
    }

    // Retrieve associated media and delete
    const mediaList = await this.mediaService.getMediaByOwners([id], 'Event');
    const mediaIds = mediaList.map(media => media.mediaId);

    if (mediaIds.length > 0) {
      await this.mediaService.deleteMultipleMedia(mediaIds);
      logger.info(`Deleted ${mediaIds.length} media files associated with Event ID: ${id}`);
    }

    // Delete event
    const isDeleted = await this.eventsRepository.delete(id);
    if (!isDeleted) {
      logger.error(`Event with ID: ${id} not found for deletion`);
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    logger.info(`Event deleted successfully with ID: ${id}`);
    return true;
  }
}
