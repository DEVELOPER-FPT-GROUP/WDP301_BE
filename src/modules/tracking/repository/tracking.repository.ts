import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tracking, TrackingDocument } from '../schema/tracking.schema';
import { PipelineStage } from 'mongoose';

@Injectable()
export class TrackingsRepository {
  constructor(@InjectModel(Tracking.name) private trackingModel: Model<TrackingDocument>) {}

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

  async findAll(): Promise<Tracking[]> {
    return this.trackingModel.find().exec();
  }

  /**
   * Aggregates total revenue by month with optional filtering
   * @param month (optional) - The month in format "YYYY-MM" to filter data
   */
  async aggregateTotalRevenueByMonth(month?: string): Promise<{ month: string; totalRevenue: number }[]> {
    const pipeline: PipelineStage[] = [{ $unwind: "$revenueHistory" }];

    if (month) {
      pipeline.push({
        $match: {
          "revenueHistory.timestamp": {
            $gte: new Date(`${month}-01T00:00:00.000Z`),
            $lt: new Date(`${month}-31T23:59:59.999Z`),
          },
        },
      });
    }

    pipeline.push(
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$revenueHistory.timestamp" } },
          totalRevenue: { $sum: "$revenueHistory.amount" },
        },
      },
      { $sort: { "_id": 1 } },
      {
        $project: {
          _id: 0,
          month: "$_id",
          totalRevenue: 1,
        },
      }
    );

    return this.trackingModel.aggregate(pipeline).exec();
  }

  /**
   * Aggregates total views by month with optional filtering
   * @param month (optional) - The month in format "YYYY-MM" to filter data
   */
  async aggregateTotalViewsByMonth(month?: string): Promise<{ month: string; totalViews: number }[]> {
    const pipeline: PipelineStage[] = [];

    if (month) {
      pipeline.push({
        $match: {
          createdAt: {
            $gte: new Date(`${month}-01T00:00:00.000Z`),
            $lt: new Date(`${month}-31T23:59:59.999Z`),
          },
        },
      });
    }

    pipeline.push(
      {
        $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          totalViews: 1,
        },
      },
      {
        $group: {
          _id: "$month",
          totalViews: { $sum: "$totalViews" },
        },
      },
      { $sort: { "_id": 1 } },
      {
        $project: {
          _id: 0,
          month: "$_id",
          totalViews: 1,
        },
      }
    );

    return this.trackingModel.aggregate(pipeline).exec();
  }
}
