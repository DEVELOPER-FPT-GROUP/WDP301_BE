import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type EventParticipantDocument = HydratedDocument<EventParticipant>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class EventParticipant {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  participant_id: string; // Primary Key

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Event', required: true })
  event_id: string; // Foreign Key referencing Events

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Member', required: true })
  member_id: string; // Foreign Key referencing Members

  @Prop()
  role_in_event: string;

  @Prop({ enum: ['pending', 'accepted', 'declined'], default: 'pending' })
  rsvp_status: string;
}

export const EventParticipantSchema = SchemaFactory.createForClass(EventParticipant);
