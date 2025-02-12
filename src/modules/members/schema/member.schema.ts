import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type MemberDocument = HydratedDocument<Member>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Member {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Family'})
  family_id: string; // Foreign Key referencing Families

  first_name: string;

  @Prop({ required: true })
  last_name: string;

  @Prop({ type: Date, required: true })
  date_of_birth: Date;

  @Prop({ type: Date })
  date_of_death: Date; // Date of death (optional)

  @Prop()
  place_of_birth: string;

  @Prop()
  place_of_death: string;

  @Prop({ default: true })
  is_alive: boolean;

  @Prop()
  generation: number;

  @Prop({ enum: ['male', 'female', 'other'], required: true })
  gender: string;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const MemberSchema = SchemaFactory.createForClass(Member);
