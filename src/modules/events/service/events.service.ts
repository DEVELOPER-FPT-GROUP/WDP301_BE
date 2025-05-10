import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from '../dto/request/create-event.dto';
import { UpdateEventDto } from '../dto/request/update-event.dto';
import { IEventService } from './events.service.interface';
import { EventsRepository } from '../repository/events.repository';
import { EventResponse } from '../dto/response/events.dto';
import { MediaService } from 'src/modules/media/serivce/media.service';
import { MulterFile } from 'src/common/types/multer-file.type';
import { MediaResponseDto } from 'src/modules/media/dto/response/media-response.dto';
import { EventMapper } from '../mapper/events.mapper';
import { winstonLogger as logger } from 'src/common/winston-logger';

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

  async createEvent(data: CreateEventDto, files: MulterFile[]): Promise<EventResponse> {
    logger.http('Received request to create a new event');
    const eventEntity = EventMapper.toEntity(data);
    const createdEvent = await this.eventsRepository.create(eventEntity);
    let mediaList: MediaResponseDto[] = [];
    if (files && files.length > 0) {
      mediaList = await this.mediaService.uploadMultipleFiles(files, createdEvent.eventId, 'Event');
    }
    logger.info(`Event created successfully with ID: ${createdEvent.eventId}`);
    return { event: EventMapper.toResponseDto(createdEvent, mediaList) };
  }

  async updateEvent(id: string, updateData: UpdateEventDto, files: MulterFile[]): Promise<EventResponse> {
    logger.http(`Received request to update event with ID: ${id}`);
  
    // Check if event exists
    const event = await this.eventsRepository.findById(id);
    if (!event) {
      logger.error(`Event with ID: ${id} not found`);
      throw new NotFoundException('Event not found');
    }
  
    // Fetch existing media upfront for consistency
    let existingMedia = await this.mediaService.getMediaByOwners([id], 'Event');
    let mediaList: MediaResponseDto[] = [];
  
    // Handle media deletion if requested
    if (updateData.isChangeImage && (updateData.deleteImageIds ?? []).length > 0) {
      logger.info(`Deleting ${updateData.deleteImageIds?.length ?? 0} media files for event ID: ${id}`);
      await Promise.all((updateData.deleteImageIds ?? []).map(imageId => this.mediaService.deleteMedia(imageId)));
      // Update existingMedia after deletion
      existingMedia = existingMedia.filter(media => !updateData.deleteImageIds?.includes(media.mediaId));
    }
  
    // Handle file uploads
    if (files.length > 0) {
      logger.info(`Uploading ${files.length} new media files for event ID: ${id}`);
      const uploadedFiles = await this.mediaService.uploadMultipleFiles(files, id, 'Event');
  
      if (updateData.isChangeImage) {
        // Replace all media with new uploads
        mediaList = uploadedFiles;
      } else {
        // Merge existing media with new uploads, deduplicating by url
        const allMedia = [...existingMedia, ...uploadedFiles];
        const mediaMap = new Map<string, MediaResponseDto>();
  
        allMedia.forEach(media => {
          // Use url as key for deduplication to handle cases where mediaId might be missing
          if (media.url) {
            mediaMap.set(media.url, media);
          }
        });
  
        mediaList = Array.from(mediaMap.values());
      }
    } else {
      // No new files uploaded
      if (!updateData.isChangeImage) {
        // Keep existing media (post-deletion if any)
        mediaList = existingMedia;
      } else {
        // isChangeImage is true but no files provided; keep remaining media after deletion
        mediaList = existingMedia;
      }
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

  async deleteEvent(id: string): Promise<boolean> {
    logger.http(`Received request to delete event with ID: ${id}`);
    const mediaList = await this.mediaService.getMediaByOwners([id], 'Event');
    const mediaIds = mediaList.map(media => media.mediaId);

    if (mediaIds.length > 0) {
      await this.mediaService.deleteMultipleMedia(mediaIds);
      logger.info(`Deleted ${mediaIds.length} media files associated with Event ID: ${id}`);
    }

    const isDeleted = await this.eventsRepository.delete(id);
    if (!isDeleted) {
      logger.error(`Event with ID: ${id} not found for deletion`);
      throw new NotFoundException(`Event with id ${id} not found`);
    }

    logger.info(`Event deleted successfully with ID: ${id}`);
    return true;
  }
}