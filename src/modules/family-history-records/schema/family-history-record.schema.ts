import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import crypto from 'crypto';

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
    for (let attempts = 0; attempts < 5; attempts++) {
      const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomPart = crypto.randomBytes(4).toString('hex'); 
      const generatedId = `HIST-${timestamp}-${randomPart}`;

      const existingRecord = await (this.constructor as any).findOne({ historicalRecordId: generatedId });
      if (!existingRecord) {
        this.historicalRecordId = generatedId;
        return next();
      }
    }
    next(new Error('Failed to generate a unique historicalRecordId after multiple attempts.'));
  } else {
    next();
  }
});
