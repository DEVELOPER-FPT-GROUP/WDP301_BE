import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Household, HouseholdDocument } from '../schema/household.schema';
import { Model } from 'mongoose';
import mongoose from 'mongoose';

@Injectable()
export class HouseholdRepository {
  constructor(
    @InjectModel(Household.name) private readonly model: Model<HouseholdDocument>
  ) {}

  async create(entity: Household): Promise<Household> {
    return new this.model(entity).save();
  }

  async findAll(): Promise<Household[]> {
    return this.model.find().exec();
  }

  async findById(id: string): Promise<Household | null> {
    return this.model.findById(new mongoose.Types.ObjectId(id)).exec();
  }

  async update(id: string, updateData: Partial<Household>): Promise<Household | null> {
    return this.model
      .findByIdAndUpdate(new mongoose.Types.ObjectId(id), updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Household | null> {
    return this.model.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
  }

  async findByBranchId(branchId: string): Promise<Household[]> {
    return this.model.find({ branchId: new mongoose.Types.ObjectId(branchId) }).exec();
  }
}
