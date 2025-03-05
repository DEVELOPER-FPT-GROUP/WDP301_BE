import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EventDocument = Event & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: true } })
export class Event {
  @Prop({ required: true, unique: true, index: true })
  eventId: string;

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

  @Prop({ enum: ['none', 'daily', 'weekly', 'monthly', 'yearly'] })
  recurrenceFrequency: string;

  @Prop({ type: Number })
  interval: number;

  @Prop()
  byDay: string;

  @Prop({ type: Number })
  byMonthDay: number;

  @Prop({ type: Date })
  recurrenceEnd: Date;

  @Prop()
  location: string;
}

export const EventSchema = SchemaFactory.createForClass(Event);

EventSchema.pre('validate', async function (next) {
  if (!this.eventId) {
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) { // Prevent infinite loops
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const generatedEventId = `EVT-${timestamp}-${randomPart}`;

      // Check if this eventId already exists in the database
      const existingEvent = await (this.constructor as any).findOne({ eventId: generatedEventId });

      if (!existingEvent) {
        this.eventId = generatedEventId;
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      return next(new Error('Failed to generate a unique eventId after multiple attempts.'));
    }
  }

  next();
});
