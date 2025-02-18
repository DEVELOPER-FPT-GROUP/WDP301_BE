import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RelationshipType, RelationshipTypeDocument } from '../schema/relationship-type.schema';

@Injectable()
export class RelationshipTypesRepository {
  constructor(
    @InjectModel(RelationshipType.name)
    private relationshipTypeModel: Model<RelationshipTypeDocument>
  ) {}

  async findById(id: string): Promise<RelationshipType | null> {
    return this.relationshipTypeModel.findById(id).lean().exec();
  }

  async create(data: { relaTypeName: string }): Promise<RelationshipType> {
    const newType = new this.relationshipTypeModel(data);
    return newType.save();
  }

  async findAll(): Promise<RelationshipType[]> {
    return this.relationshipTypeModel.find().lean().exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.relationshipTypeModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findByName(name: string): Promise<RelationshipType | null> {
    return this.relationshipTypeModel.findOne({ relaTypeName: name }).lean().exec();
  }
}
