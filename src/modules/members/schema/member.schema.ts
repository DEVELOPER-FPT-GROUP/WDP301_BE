import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type MemberDocument = HydratedDocument<Member>;

@Schema({ timestamps: true })
export class Member {
  _id: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Family'})
  familyId: MongooseSchema.Types.ObjectId;

  @Prop()
  firstName: string;

  @Prop()
  middleName: string;

  @Prop()
  lastName: string;

  @Prop()
  dateOfBirth: Date;

  @Prop()
  dateOfDeath: Date;

  @Prop()
  placeOfBirth: string;

  @Prop()
  placeOfDeath: string;

  @Prop({ default: true })
  isAlive: boolean;

  @Prop()
  generation: number;

  @Prop()
  shortSummary: string;

  @Prop()
  gender: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}


export const MemberSchema = SchemaFactory.createForClass(Member);
