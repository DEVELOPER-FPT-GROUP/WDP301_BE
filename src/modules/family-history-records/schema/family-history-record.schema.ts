import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type FamilyHistoryRecordDocument = HydratedDocument<FamilyHistoryRecord>;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class FamilyHistoryRecord {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  historicalRecordId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Family', required: true })
  familyId: string;

  @Prop({ required: true })
  historicalRecordTitle: string;

  @Prop()
  historicalRecordSummary: string;

  @Prop()
  historicalRecordDetails: string;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date; // Changed from end_date

  @Prop({ type: Date, default: Date.now })
  createdAt: Date; // Changed from created_at

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date; // Changed from updated_at
}

export const FamilyHistoricalRecordSchema = SchemaFactory.createForClass(FamilyHistoryRecord);
