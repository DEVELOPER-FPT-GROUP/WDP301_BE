import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FamilyDocument = HydratedDocument<Family>;

@Schema({ timestamps: true })
export class Family {
  @Prop()
  adminAccountId: string;

  @Prop()
  familyName: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const FamilySchema = SchemaFactory.createForClass(Family);
