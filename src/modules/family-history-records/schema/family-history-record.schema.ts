import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type FamilyHistoricalRecordDocument = HydratedDocument<FamilyHistoricalRecord>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class FamilyHistoricalRecord {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  milestone_id: string; // Primary Key

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Family', required: true })
  family_id: string; // Foreign Key referencing Families

  @Prop({ required: true })
  milestone_title: string; // Title of the milestone

  @Prop()
  milestone_summary: string; // Brief summary of the milestone

  @Prop()
  milestone_details: string; // Detailed description of the milestone

  @Prop({ type: Date, required: true })
  start_date: Date; // Start date of the milestone

  @Prop({ type: Date })
  end_date: Date; // End date of the milestone

  @Prop({ type: Date, default: Date.now })
  created_at: Date; // Automatically generated creation timestamp

  @Prop({ type: Date, default: Date.now })
  updated_at: Date; // Automatically generated update timestamp
}

export const FamilyHistoricalRecordSchema = SchemaFactory.createForClass(FamilyHistoricalRecord);
