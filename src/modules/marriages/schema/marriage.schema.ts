import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type MarriageDocument = HydratedDocument<Marriage>;

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt
export class Marriage {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  marriage_id: string; // Primary Key

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Member', required: true })
  wife_id: string; // Foreign Key referencing Wife (Member)

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Member', required: true })
  husband_id: string; // Foreign Key referencing Husband (Member)

  @Prop({ default: false })
  is_divorced: boolean; // Whether the marriage is divorced

  @Prop({ type: Date, required: true })
  married_date: Date; // The date of marriage

  @Prop({ type: Date })
  divorced_date: Date; // The date of divorce (if applicable)
}

export const MarriageSchema = SchemaFactory.createForClass(Marriage);
