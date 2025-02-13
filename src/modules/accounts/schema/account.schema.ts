import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;
@Schema({ timestamps: true })
export class Account {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Member' })
  memberId: string;

  @Prop({ required: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: false })
  isAdmin: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
