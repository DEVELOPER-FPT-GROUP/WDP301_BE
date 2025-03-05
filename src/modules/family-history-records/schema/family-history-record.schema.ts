import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type FamilyHistoryRecordDocument = HydratedDocument<FamilyHistoryRecord>;

@Schema({ timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } })
export class FamilyHistoryRecord {
  @Prop({ required: true, unique: true, index: true })
  historicalRecordId: string; // ✅ Auto-generated

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Family', required: true })
  familyId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  historicalRecordTitle: string;

  @Prop()
  historicalRecordSummary: string;

  @Prop()
  historicalRecordDetails: string;

  @Prop({ type: Date, required: true })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const FamilyHistoryRecordSchema = SchemaFactory.createForClass(FamilyHistoryRecord);

// Middleware to generate a unique historicalRecordId
FamilyHistoryRecordSchema.pre<FamilyHistoryRecordDocument>('validate', async function (next) {
  if (!this.historicalRecordId) {
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = Math.floor(1000 + Math.random() * 9000);
      const uuidSegment = uuidv4().slice(0, 8); // Generate a short UUID segment
      const generatedHistoricalRecordId = `HIST-${timestamp}-${randomPart}-${uuidSegment}`;

      // Check if the generated ID already exists
      const existingRecord = await (this.constructor as any).findOne({ historicalRecordId: generatedHistoricalRecordId });

      if (!existingRecord) {
        this.historicalRecordId = generatedHistoricalRecordId;
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      return next(new Error('Failed to generate a unique historicalRecordId after multiple attempts.'));
    }
  }

  next();
});
