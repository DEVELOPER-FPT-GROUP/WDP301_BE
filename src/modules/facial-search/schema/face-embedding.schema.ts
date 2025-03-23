import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types, HydratedDocument } from 'mongoose';

export type FaceEmbeddingDocument = HydratedDocument<FaceEmbedding>;

@Schema({ timestamps: true })
export class FaceEmbedding {
  _id: Types.ObjectId;  // ✅ Change this to `Types.ObjectId`

  @Prop({ type: Types.ObjectId, ref: 'Member', required: true })  // ✅ Use `Types.ObjectId`
  memberId: Types.ObjectId;

  @Prop({ type: String, required: true })
  mediaId: string;

  @Prop({ type: [Number], required: true })
  faceDescriptor: number[];

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;
}

export const FaceEmbeddingSchema = SchemaFactory.createForClass(FaceEmbedding);
