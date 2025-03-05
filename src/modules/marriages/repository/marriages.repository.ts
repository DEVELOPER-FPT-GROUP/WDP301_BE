import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Marriage, MarriageDocument } from '../schema/marriage.schema';
import { CreateMarriageDto } from '../dto/request/create-marriage.dto';
import { In } from 'typeorm';

@Injectable()
export class MarriagesRepository {
  constructor(@InjectModel(Marriage.name) private marriageModel: Model<MarriageDocument>) {}

  async findById(id: string): Promise<Marriage | null> {
    return this.marriageModel.findOne({ _id: id }).exec();
  }

  async create(data: CreateMarriageDto): Promise<Marriage> {
    const newMarriage = new this.marriageModel(data);
    return newMarriage.save();
  }

  async update(id: string, updateData: Partial<CreateMarriageDto>): Promise<Marriage | null> {
    return this.marriageModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true },
    ).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.marriageModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findAll(): Promise<Marriage[]> {
    return this.marriageModel.find().exec();
  }

  async getSpouse(memberId: string): Promise<Marriage | null> {
    return await this.marriageModel.findOne({
      $or: [{ husbandId: memberId }, { wifeId: memberId }],
    }).exec();
  }

  async getAllSpouses(memberIds: string[]): Promise<Marriage[]> {
    if (!memberIds.length) return [];

    return await this.marriageModel.find({
      $or: [
        { husbandId: { $in: memberIds } },
        { wifeId: { $in: memberIds } }
      ]
    }).exec();
  }

}
