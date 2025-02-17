import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RelationshipTypeDocument = HydratedDocument<RelationshipType>;

@Schema({ timestamps: true })
export class RelationshipType {
  @Prop()
  relaTypeName: string;
}

export const RelationshipTypeSchema = SchemaFactory.createForClass(RelationshipType);
