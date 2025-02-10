import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Event {
  @Prop({ required: true, unique: true })
  event_id: string; // Primary Key

  @Prop({ required: true })
  created_by: string; // ID of the creator

  @Prop()
  rela_type_name: string; // Relationship type name (optional)

  @Prop()
  event_scope: string; // Scope of the event

  @Prop()
  event_type: string; // Type of the event

  @Prop({ required: true })
  event_name: string; // Name of the event

  @Prop()
  event_description: string; // Description of the event

  @Prop({ type: Date })
  gregorian_event_date: Date; // Gregorian event date

  @Prop({ type: String })
  lunar_event_date: string; // Lunar event date (string format)

  @Prop()
  recurrence_rule: string; // Recurrence rule (e.g., daily, weekly)

  @Prop({ type: Date })
  end_recurrence_date: Date; // End date of recurrence

  @Prop()
  location: string; // Location of the event

  @Prop({ type: Date, default: Date.now })
  created_at: Date; // Creation timestamp
}

export const EventSchema = SchemaFactory.createForClass(Event);
