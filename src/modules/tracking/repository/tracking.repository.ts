import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tracking, TrackingDocument } from '../schema/tracking.schema';

@Injectable()
export class TrackingsRepository {
  constructor(@InjectModel(Tracking.name) private trackingModel: Model<TrackingDocument>) {}

  async findById(id: string): Promise<Tracking | null> {
    return this.trackingModel.findById(id).exec();
  }

  async findOne(): Promise<Tracking | null> {
    return this.trackingModel.findOne().exec();
  }

  async create(data: Partial<Tracking>): Promise<Tracking> {
    const newTracking = new this.trackingModel(data);
    return newTracking.save();
  }

  async update(id: string, updateData: Partial<Tracking>): Promise<Tracking | null> {
    return this.trackingModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.trackingModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findAll(): Promise<Tracking[]> {
    return this.trackingModel.find().exec();
  }
}
