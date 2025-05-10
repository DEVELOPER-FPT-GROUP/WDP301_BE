import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type FamilyDocument = HydratedDocument<Family>;

@Schema({ timestamps: true })
export class Family {
  _id: MongooseSchema.Types.ObjectId;

  @Prop()
  adminAccountId: string;

  @Prop()
  familyName: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const FamilySchema = SchemaFactory.createForClass(Family);
