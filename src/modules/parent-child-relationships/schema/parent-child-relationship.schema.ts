import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ParentChildRelationshipDocument = HydratedDocument<ParentChildRelationship>;

@Schema({ timestamps: true })
export class ParentChildRelationship {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Member' })
  parentId: MongooseSchema.Types.ObjectId; // Foreign Key referencing the parent (Member)

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Member' })
  childId: MongooseSchema.Types.ObjectId; // Foreign Key referencing the child (Member)

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'RelationshipType' })
  relaTypeId: MongooseSchema.Types.ObjectId; // Foreign Key referencing the relationship type

  @Prop()
  birthOrder: number; // Birth order of the child
}

export const ParentChildRelationshipSchema = SchemaFactory.createForClass(ParentChildRelationship);
