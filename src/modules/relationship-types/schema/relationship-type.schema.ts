import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type RelationshipTypeDocument = HydratedDocument<RelationshipType>;

@Schema({ timestamps: true })
export class RelationshipType {
  _id: MongooseSchema.Types.ObjectId;

  @Prop()
  relaTypeName: string;
}

export const RelationshipTypeSchema = SchemaFactory.createForClass(RelationshipType);
