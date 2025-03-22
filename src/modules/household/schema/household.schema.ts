import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type HouseholdDocument = HydratedDocument<Household>;

@Schema({ timestamps: true })
export class Household {
  _id: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Household', default: null })
  parentHouseholdId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Account', default: null })
  headAccountId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Branch' })
  branchId: mongoose.Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const HouseholdSchema = SchemaFactory.createForClass(Household);
