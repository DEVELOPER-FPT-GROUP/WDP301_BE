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

  private async withTransaction<T>(
    operation: (session: ClientSession) => Promise<T>
  ): Promise<T> {
    const session = await this.memberModel.db.startSession();
    session.startTransaction();
    try {
      const result = await operation(session);
      await session.commitTransaction();
      session.endSession();
      return result;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

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

  async createWithTransaction(data: CreateMemberDto): Promise<Member> {
    return this.withTransaction(async (session) => {
      const newMember = new this.memberModel(data);
      return newMember.save({ session });
    });
  }

  async updateWithTransaction(id: string, updateData: UpdateMemberDto): Promise<Member | null> {
    return this.withTransaction(async (session) => {
      return this.memberModel.findOneAndUpdate(
        { _id: id },
        updateData,
        { new: true, session },
      ).exec();
    });
  }
}
