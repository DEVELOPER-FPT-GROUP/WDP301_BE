import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Family, FamilyDocument } from '../schema/family.schema';
import { CreateFamilyDto } from '../dto/request/create-family.dto';
import { UpdateFamilyDto } from '../dto/request/update-family.dto';

@Injectable()
export class FamiliesRepository {
  constructor(
    @InjectModel(Family.name) private familyModel: Model<FamilyDocument>
  ) {}

  async findById(id: string): Promise<Family | null> {
    return this.familyModel.findOne({ _id: id }).exec();
  }

  async create(data: CreateFamilyDto): Promise<Family> {
    const newFamily = new this.familyModel(data);
    return newFamily.save();
  }

  async update(id: string, updateData: UpdateFamilyDto): Promise<Family | null> {
    return this.familyModel.findOneAndUpdate(
      { _id: id }, // Match by family_id
      updateData,
      { new: true }, // Return the updated document
    ).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.familyModel.deleteOne({ familyId: id }).exec();
    return result.deletedCount > 0; // Return true if a document was deleted
  }

  async findAll(): Promise<Family[]> {
    return this.familyModel.find().exec();
  }
}
