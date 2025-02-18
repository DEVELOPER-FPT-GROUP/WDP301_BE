import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { FamilyHistoryRecord, FamilyHistoryRecordDocument } from '../schema/family-history-record.schema';
import { CreateFamilyHistoryRecordDto } from '../dto/request/create-family-history-record.dto';
import { UpdateFamilyHistoryRecordDto } from '../dto/request/update-family-history-record.dto';

@Injectable()
export class FamilyHistoryRecordsRepository {
  constructor(
    @InjectModel(FamilyHistoryRecord.name) private familyHistoryRecordModel: Model<FamilyHistoryRecordDocument>
  ) {}

  async findById(id: string): Promise<FamilyHistoryRecord | null> {
    return this.familyHistoryRecordModel.findOne({ _id: id }).exec();
  }

  async create(data: CreateFamilyHistoryRecordDto): Promise<FamilyHistoryRecord> {
    const newRecord = new this.familyHistoryRecordModel(data);
    return newRecord.save();
  }

  async update(id: string, updateData: UpdateFamilyHistoryRecordDto): Promise<FamilyHistoryRecord | null> {
    return this.familyHistoryRecordModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true },
    ).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.familyHistoryRecordModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findAll(): Promise<FamilyHistoryRecord[]> {
    return this.familyHistoryRecordModel.find().exec();
  }
}
