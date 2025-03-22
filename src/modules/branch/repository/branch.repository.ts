import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Branch, BranchDocument } from '../schema/branch.schema';
import { Model } from 'mongoose';
import mongoose from 'mongoose';

@Injectable()
export class BranchRepository {
  constructor(@InjectModel(Branch.name) private readonly branchModel: Model<BranchDocument>) {}

  async create(branch: Branch): Promise<Branch> {
    return new this.branchModel(branch).save();
  }

  async findAll(): Promise<Branch[]> {
    return this.branchModel.find().exec();
  }

  async findById(id: string): Promise<Branch | null> {
    return this.branchModel.findById(new mongoose.Types.ObjectId(id)).exec();
  }

  async update(id: string, updateData: Partial<Branch>): Promise<Branch | null> {
    return this.branchModel
      .findByIdAndUpdate(new mongoose.Types.ObjectId(id), updateData, { new: true })
      .exec();
  }

  async delete(id: string): Promise<Branch | null> {
    return this.branchModel.findByIdAndDelete(new mongoose.Types.ObjectId(id)).exec();
  }
}
