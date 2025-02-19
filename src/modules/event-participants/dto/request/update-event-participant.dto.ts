import { PartialType } from '@nestjs/mapped-types';
import { CreateEventParticipantDto } from './create-event-participant.dto';

export class UpdateEventParticipantDto extends PartialType(CreateEventParticipantDto) {}
