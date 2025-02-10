import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type MemberDocument = HydratedDocument<Member>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } })
export class Member {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  member_id: string; // Primary Key

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Family', required: true })
  family_id: string; // Foreign Key referencing Families

  @Prop({ required: true })
  first_name: string; // First name of the member

  @Prop({ required: true })
  last_name: string; // Last name of the member

  @Prop({ type: Date, required: true })
  date_of_birth: Date; // Date of birth

  @Prop({ type: Date })
  date_of_death: Date; // Date of death (optional)

  @Prop()
  place_of_birth: string; // Place of birth

  @Prop()
  place_of_death: string; // Place of death (optional)

  @Prop({ default: true })
  is_alive: boolean; // Whether the member is still alive (default: true)

  @Prop()
  generation: number; // The generation number of the member

  @Prop({ enum: ['male', 'female', 'other'], required: true })
  gender: string; // Gender of the member

  @Prop({ type: Date, default: Date.now })
  created_at: Date; // Auto-generated creation timestamp

  @Prop({ type: Date, default: Date.now })
  updated_at: Date; // Auto-generated update timestamp
}

export const MemberSchema = SchemaFactory.createForClass(Member);
