import { CreateEventDto } from '../dto/request/create-event.dto';
import { UpdateEventDto } from '../dto/request/update-event.dto';
import { EventResponse } from '../dto/response/events.dto';
import { MulterFile } from 'src/common/types/multer-file.type';

export interface IEventService {
  getEventById(id: string): Promise<EventResponse>;
  createEvent(data: CreateEventDto, files: MulterFile[]): Promise<EventResponse>;
  updateEvent(id: string, updateData: UpdateEventDto, files: MulterFile[]): Promise<EventResponse>;
  deleteEvent(id: string): Promise<boolean>;
}