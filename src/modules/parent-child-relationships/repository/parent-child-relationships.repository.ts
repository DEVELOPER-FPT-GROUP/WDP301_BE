import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ParentChildRelationship, ParentChildRelationshipDocument } from '../schema/parent-child-relationship.schema';
import { CreateParentChildRelationshipDto } from '../dto/request/create-parent-child-relationship.dto';
import { UpdateParentChildRelationshipDto } from '../dto/request/update-parent-child-relationship.dto';

@Injectable()
export class ParentChildRelationshipsRepository {
  constructor(
    @InjectModel(ParentChildRelationship.name)
    private parentChildModel: Model<ParentChildRelationshipDocument>
  ) {}

  async findById(id: string): Promise<ParentChildRelationship | null> {
    return this.parentChildModel.findById(id).lean().exec();
  }

  async create(data: CreateParentChildRelationshipDto): Promise<ParentChildRelationship> {
    const newRelationship = new this.parentChildModel(data);
    return newRelationship.save();
  }

  async update(id: string, updateData: Partial<UpdateParentChildRelationshipDto>): Promise<ParentChildRelationship | null> {
    return this.parentChildModel.findByIdAndUpdate(id, updateData, { new: true }).lean().exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.parentChildModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findAll(): Promise<ParentChildRelationship[]> {
    return this.parentChildModel.find().lean().exec();
  }
}
