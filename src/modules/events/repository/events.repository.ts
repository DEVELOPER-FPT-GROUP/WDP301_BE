import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {Event, EventDocument } from '../schema/event.schema';
import { CreateEventDto } from '../dto/request/create-event.dto';
import { UpdateEventDto } from '../dto/request/update-event.dto';

@Injectable()
export class EventsRepository {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<EventDocument>
  ) {}

  async findById(id: string): Promise<Event | null> {
    return this.eventModel.findOne({ eventId: id }).exec();
  }

  async create(data: CreateEventDto): Promise<Event> {
    const newEvent = new this.eventModel(data);
    return newEvent.save();
  }

  async update(id: string, updateData: UpdateEventDto): Promise<Event | null> {
    return this.eventModel.findOneAndUpdate(
      { eventId: id }, 
      updateData,
      { new: true }, 
    ).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.eventModel.deleteOne({ eventId: id }).exec();
    return result.deletedCount > 0;}

  async findAll(): Promise<Event[]> {
    return this.eventModel.find().exec();
  }
}