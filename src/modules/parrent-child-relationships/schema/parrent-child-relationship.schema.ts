import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ParentChildRelationshipDocument = HydratedDocument<ParentChildRelationship>;

@Schema({ timestamps: true }) // Automatically adds createdAt and updatedAt
export class ParentChildRelationship {
  @Prop({ type: MongooseSchema.Types.ObjectId, required: true, unique: true })
  relationship_id: string; // Primary Key

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Member', required: true })
  parent_id: string; // Foreign Key referencing the parent (Member)

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Member', required: true })
  child_id: string; // Foreign Key referencing the child (Member)

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RelationshipType', required: true })
  rela_type_id: string; // Foreign Key referencing the relationship type

  @Prop()
  birth_order: number; // Birth order of the child
}

export const ParentChildRelationshipSchema = SchemaFactory.createForClass(ParentChildRelationship);
