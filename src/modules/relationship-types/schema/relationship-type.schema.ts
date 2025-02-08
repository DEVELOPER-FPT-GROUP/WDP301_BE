import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type RelationshipTypeDocument = HydratedDocument<RelationshipType>;

@Schema({ timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }) // Custom timestamps
export class RelationshipType {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  rela_type_id: string; // Primary Key

  @Prop({ required: true, unique: true })
  rela_type_name: string; // Name of the relationship type
}

export const RelationshipTypeSchema = SchemaFactory.createForClass(RelationshipType);
