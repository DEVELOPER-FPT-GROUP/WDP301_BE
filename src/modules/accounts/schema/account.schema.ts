import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export type AccountDocument = HydratedDocument<Account>;

@Schema({ timestamps: true })
export class Account {
  _id: mongoose.Types.ObjectId;

  @Prop({ type: mongoose.Types.ObjectId, ref: 'Member' })
  memberId: mongoose.Types.ObjectId;

  @Prop()
  username: string;

  @Prop()
  passwordHash: string;

  @Prop()
  email: string;

  @Prop({ default: false })
  isAdmin: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop()
  refreshToken: string;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
