import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model } from 'mongoose';
import { Member, MemberDocument } from '../schema/member.schema';
import { CreateMemberDto } from '../dto/request/create-member.dto';
import { UpdateMemberDto } from '../dto/request/update-member.dto';

@Injectable()
export class MembersRepository {
  constructor(
    @InjectModel(Member.name) private memberModel: Model<MemberDocument>
  ) {}

  async findById(id: string): Promise<Member | null> {
    return this.memberModel.findOne({ _id: id }).exec();
  }

  async create(data: CreateMemberDto): Promise<Member> {
    const newFamily = new this.memberModel(data);
    return newFamily.save();
  }

  async update(id: string, updateData: UpdateMemberDto): Promise<Member | null> {
    return this.memberModel.findOneAndUpdate(
      { _id: id },
      updateData,
      { new: true },
    ).exec();
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.memberModel.deleteOne({ familyId: id }).exec();
    return result.deletedCount > 0;
  }

  async findAll(): Promise<Member[]> {
    return this.memberModel.find().exec();
  }

  async findMembersInFamily(familyId: string): Promise<Member[]> {
    return this.memberModel.find({ familyId }).exec();
  }
}
