import { Injectable } from '@nestjs/common';
import { CreateEventParticipantDto } from './dto/create-event-participant.dto';
import { UpdateEventParticipantDto } from './dto/update-event-participant.dto';

@Injectable()
export class EventParticipantsService {
  create(createEventParticipantDto: CreateEventParticipantDto) {
    return 'This action adds a new eventParticipant';
  }

  findAll() {
    return `This action returns all eventParticipants`;
  }

  findOne(id: number) {
    return `This action returns a #${id} eventParticipant`;
  }

  update(id: number, updateEventParticipantDto: UpdateEventParticipantDto) {
    return `This action updates a #${id} eventParticipant`;
  }

  remove(id: number) {
    return `This action removes a #${id} eventParticipant`;
  }
}
