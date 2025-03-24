import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';

export type BranchDocument = HydratedDocument<Branch>;

@Schema({ timestamps: true })
export class Branch {
  _id: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Family' })
  familyId: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Branch', default: null })
  parentBranchId?: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Account', default: null })
  headAccountId?: mongoose.Types.ObjectId;

  @Prop({ required: true })
  branchName: string;

  @Prop({ default: 0 })
  branchLevel: number;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}

export const BranchSchema = SchemaFactory.createForClass(Branch);
