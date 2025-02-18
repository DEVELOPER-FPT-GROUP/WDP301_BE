import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Media, MediaDocument } from '../schema/media.schema';

@Injectable()
export class MediaRepository {
  constructor(@InjectModel(Media.name) private readonly mediaModel: Model<MediaDocument>) {}

  async create(media: Media): Promise<Media> {
    return new this.mediaModel(media).save();
  }

  async findAll(): Promise<Media[]> {
    return this.mediaModel.find().exec();
  }

  async findById(id: string): Promise<Media | null> {
    return this.mediaModel.findOne({ mediaId: id }).exec();
  }

  async findByOwner(ownerId: string, ownerType: 'Event' | 'Member'): Promise<Media[]> {
    return this.mediaModel.find({ ownerId: ownerId, ownerType: ownerType }).exec();
  }

  async update(id: string, updateData: Partial<Media>): Promise<Media | null> {
    return this.mediaModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async delete(id: string): Promise<Media | null> {
    return this.mediaModel.findByIdAndDelete(id).exec();
  }
}
