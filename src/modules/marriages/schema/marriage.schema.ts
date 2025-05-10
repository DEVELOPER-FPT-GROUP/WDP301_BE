import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type MarriageDocument = HydratedDocument<Marriage>;

@Schema({ timestamps: true })
export class Marriage {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Member' })
  wifeId: MongooseSchema.Types.ObjectId; // Foreign Key referencing Wife (Member)

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Member' })
  husbandId: MongooseSchema.Types.ObjectId; // Foreign Key referencing Husband (Member)

  @Prop({ default: false })
  isDivorced: boolean;

  @Prop({ type: Date })
  marriedDate: Date;

  @Prop({ type: Date })
  divorcedDate: Date;
}

export const MarriageSchema = SchemaFactory.createForClass(Marriage);
