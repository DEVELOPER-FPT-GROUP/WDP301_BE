import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type FamilyDocument = HydratedDocument<Family>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: false } })
export class Family {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  family_id: string; // Primary Key

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Account', required: true })
  admin_account_id: string; // Foreign Key referencing Accounts

  @Prop({ required: true })
  family_name: string; // Name of the family

  @Prop({ type: Date, default: Date.now })
  created_at: Date; // Automatically generated creation timestamp
}

export const FamilySchema = SchemaFactory.createForClass(Family);
