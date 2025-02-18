import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateEventDto } from '../dto/request/create-event.dto';
import { UpdateEventDto } from '../dto/request/update-event.dto';
import { IEventService } from './events.service.interface';
import { EventsRepository } from '../repository/events.repository';
import { EventDTO, EventResponse } from '../dto/response/events.dto';


@Injectable()
export class EventsService implements IEventService
{
  constructor(private readonly eventsRepository: EventsRepository) {}

  async getEventById(id: string): Promise<EventResponse> {
    const event = await this.eventsRepository.findById(id);
    if (!event) {
      throw new NotFoundException('Event not found');
    }
    return { event: EventDTO.map(event) };
  }
  async createEvent(data: CreateEventDto): Promise<EventResponse> {
    const createdEvent = await this.eventsRepository.create(data);
    return { event: EventDTO.map(createdEvent) };
  }
  async updateEvent(id: string, updateData: UpdateEventDto): Promise<EventResponse> {
    const updatedEvent = await this.eventsRepository.update(id, updateData);
    if (!updatedEvent) {
      throw new NotFoundException('Event not found');
    }
    return { event: EventDTO.map(updatedEvent)
  }}
  async deleteEvent(id: string): Promise<boolean> {
    const isDeleted = await this.eventsRepository.delete(id);
    if (!isDeleted) {
      throw new NotFoundException('Event not found');
    }
    return true;
  }

}