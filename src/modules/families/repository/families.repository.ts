import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Family, FamilyDocument } from '../schema/family.schema';
import { CreateFamilyDto } from '../dto/request/create-family.dto';
import { UpdateFamilyDto } from '../dto/request/update-family.dto';

@Injectable()
export class FamiliesRepository {
  constructor(
    @InjectModel(Family.name) private familyModel: Model<FamilyDocument>
  ) {}

  async findById(id: string): Promise<Family | null> {
    return this.familyModel.findOne({ _id: new mongoose.Types.ObjectId(id) }) .exec();
  }

  async create(data: CreateFamilyDto): Promise<Family> {
    const newFamily = new this.familyModel(data);
    return newFamily.save();
  }

  async update(id: string, updateData: UpdateFamilyDto): Promise<Family | null> {
    return this.familyModel.findOneAndUpdate(
      { _id: new mongoose.Types.ObjectId(id) }, // Match by family_id
      updateData,
      { new: true }, // Return the updated document
    ).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.familyModel.deleteOne({ familyId: new mongoose.Types.ObjectId(id) }).exec();
    return result.deletedCount > 0; // Return true if a document was deleted
  }

  async findAll(): Promise<Family[]> {
    return this.familyModel.find().exec();
  }

  async findFamiliesByFilters(filters: any, page: number, limit: number): Promise<{ families: Family[]; total: number }> {
    const skip = (page - 1) * limit;

    const [families, total] = await Promise.all([
      this.familyModel.find(filters).skip(skip).limit(limit).exec(),
      this.familyModel.countDocuments(filters).exec()
    ]);

    return { families, total };
  }

  async findByAdminAccountId(adminAccountId: string): Promise<Family | null> {
    return this.familyModel.findOne({ adminAccountId }).exec();
  }
}
