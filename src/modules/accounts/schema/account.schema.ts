import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type AccountDocument = HydratedDocument<Account>;
@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt fields
export class Account {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  account_id: string; // Primary Key

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Member', required: true })
  member_id: string; // Foreign Key, referencing Member

  @Prop({ required: true, unique: true })
  username: string; // Unique username for the account

  @Prop({ required: true })
  password_hash: string; // Hashed password for security

  @Prop({ required: true, unique: true })
  email: string; // Unique email for the account

  @Prop({ default: false })
  is_admin: boolean; // Boolean indicating admin status

  @Prop({ type: Date, default: Date.now })
  created_at: Date; // Account creation timestamp
}

export const AccountSchema = SchemaFactory.createForClass(Account);
