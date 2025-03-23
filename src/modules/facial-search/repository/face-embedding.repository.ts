import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FaceEmbedding, FaceEmbeddingDocument } from '../schema/face-embedding.schema';
import { winstonLogger as logger } from 'src/common/winston-logger';

@Injectable()
export class FaceEmbeddingRepository {
  constructor(
    @InjectModel(FaceEmbedding.name) private faceEmbeddingModel: Model<FaceEmbeddingDocument>,
  ) {}

  async create(data: Partial<FaceEmbedding>): Promise<FaceEmbeddingDocument> {
    logger.info(`Creating face embedding for member: ${data.memberId}`);
    const newEmbedding = new this.faceEmbeddingModel(data);
    return await newEmbedding.save();
  }

   /**
     * Update an existing face embedding or create a new one if not exists
     */
   async update(mediaId: string, updateData: Partial<FaceEmbedding>): Promise<FaceEmbeddingDocument | null> {
    return this.faceEmbeddingModel.findOneAndUpdate(
        { mediaId }, // Search condition
        { $set: updateData }, // Update operation
        { new: true, upsert: true } // Return updated doc, create if not exists
    ).exec();
}

  async findByMediaId(mediaId: string): Promise<FaceEmbeddingDocument | null> {
    return this.faceEmbeddingModel.findOne({ mediaId }).exec();
  }

  async findByMemberId(memberId: string): Promise<FaceEmbeddingDocument[]> {
    return this.faceEmbeddingModel.find({ memberId }).exec();
  }

  async findAll(): Promise<FaceEmbeddingDocument[]> {
    return this.faceEmbeddingModel.find().exec();
  }

  async delete(id: string): Promise<FaceEmbeddingDocument | null> {
    return this.faceEmbeddingModel.findByIdAndDelete(id).exec();
  }

  async deleteByMemberId(memberId: string): Promise<{ deletedCount: number }> {
    const result = await this.faceEmbeddingModel.deleteMany({ memberId }).exec();
    return { deletedCount: result.deletedCount || 0 };
  }

  async deleteByMediaId(mediaId: string): Promise<{ deletedCount: number }> {
    const result = await this.faceEmbeddingModel.deleteMany({ mediaId }).exec();
    return { deletedCount: result.deletedCount || 0 };
  }
}