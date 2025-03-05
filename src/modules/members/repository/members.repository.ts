import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { ClientSession, Model } from 'mongoose';
import { Member, MemberDocument } from '../schema/member.schema';
import { CreateMemberDto } from '../dto/request/create-member.dto';
import { UpdateMemberDto } from '../dto/request/update-member.dto';

@Injectable()
export class MembersRepository {
  constructor(
    @InjectModel(Member.name) private memberModel: Model<MemberDocument>
  ) {}

  async findById(id: string): Promise<Member | null> {
    return this.memberModel.findOne({ _id: new mongoose.Types.ObjectId(id) }).exec();
  }

  async create(data: CreateMemberDto): Promise<Member> {
    const newMember = new this.memberModel(data);
    return newMember.save();
  }

  async update(id: string, updateData: UpdateMemberDto): Promise<Member | null> {
    return this.memberModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true }
    ).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.memberModel.deleteOne({ _id: id }).exec();
    return result.deletedCount > 0;
  }

  async findAll(): Promise<Member[]> {
    return this.memberModel.find().exec();
  }

  async findMembersInFamily(familyId: string): Promise<Member[]> {
    return this.memberModel.find({ familyId }).exec();
  }

  /**
   * Finds members with search filters and supports pagination.
   * @param filters - The search criteria.
   * @param page - The current page number.
   * @param limit - The number of records per page.
   * @returns An object containing the matching members and total count.
   */
  async findByFilters(filters: any, page: number, limit: number): Promise<{ members: Member[]; total: number }> {
    const skip = (page - 1) * limit;

    const [members, total] = await Promise.all([
      this.memberModel.find(filters).skip(skip).limit(limit).exec(),
      this.memberModel.countDocuments(filters).exec()
    ]);

    return { members, total };
  }
}
