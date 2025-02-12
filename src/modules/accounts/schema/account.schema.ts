import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;
@Schema({ timestamps: true })
export class Account {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Member', required: true })
  member_id: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: false })
  is_admin: boolean;

  @Prop({ type: Date, default: Date.now })
  created_at: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
