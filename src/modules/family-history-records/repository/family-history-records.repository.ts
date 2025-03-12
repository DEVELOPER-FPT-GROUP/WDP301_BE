import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { FamilyHistoryRecord, FamilyHistoryRecordDocument } from '../schema/family-history-record.schema';

@Injectable()
export class FamilyHistoryRecordRepository {
  constructor(@InjectModel(FamilyHistoryRecord.name) private readonly recordModel: Model<FamilyHistoryRecordDocument>) { }

  /**
   * Creates a new Family History Record
   */
  async create(record: FamilyHistoryRecord): Promise<FamilyHistoryRecord> {
    return new this.recordModel(record).save();
  }

  /**
   * Finds all historical records
   */
  async findAll(): Promise<FamilyHistoryRecord[]> {
    return this.recordModel.find().exec();
  }

  /**
   * Finds a historical record by ID
   */
  async findById(id: string): Promise<FamilyHistoryRecord | null> {
    return this.recordModel.findOne({ historicalRecordId: id }).select('-__v').lean().exec();
  }

  async findByFamilyId(familyId: string): Promise<FamilyHistoryRecord[]> {
    return this.recordModel.find({ familyId }).sort({ startDate: 1 }).select('-__v').lean().exec();
  }

  /**
   * Updates a historical record by ID
   */
  async update(id: string, updateData: Partial<FamilyHistoryRecord>): Promise<FamilyHistoryRecord | null> {
    return this.recordModel.findOneAndUpdate({ historicalRecordId: id }, updateData, { new: true }).exec();
  }

  /**
   * Deletes a historical record by ID
   */
  async delete(id: string): Promise<FamilyHistoryRecord | null> {
    return this.recordModel.findOneAndDelete({ historicalRecordId: id }).exec();
  }

  async findByFamilyIdWithFilters(filters: any, page: number, limit: number, sortOptions: any = {}): Promise<{ records: FamilyHistoryRecord[]; total: number }> {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.recordModel.find(filters).sort(sortOptions)
        .skip(skip).limit(limit).select('-__v').lean().exec(),
      this.recordModel.countDocuments(filters),
    ]);

    return { records, total };
  }


}
