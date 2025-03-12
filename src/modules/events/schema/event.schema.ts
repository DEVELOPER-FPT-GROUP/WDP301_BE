import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import crypto from 'crypto';

export type EventDocument = HydratedDocument<Event>;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class Event {
  @Prop({ required: true, unique: true, index: true })
  eventId: string; // Auto-generated

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  eventScope: string;

  @Prop()
  eventType: string;

  @Prop({ required: true })
  eventName: string;

  @Prop()
  eventDescription: string;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop()
  recurrenceFrequency: string;

  @Prop()
  interval: number;

  @Prop()
  byDay: string;

  @Prop()
  byMonthDay: number;

  @Prop({ type: Date })
  recurrenceEnd: Date;

  @Prop()
  location: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.pre<EventDocument>('save', function (next) {
  if (!this.eventId) {
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    this.eventId = `EVENT-${timestamp}-${crypto.randomBytes(4).toString('hex')}`;
  }
  next();
});
