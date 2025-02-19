import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { Account, AccountDocument } from '../schema/account.schema';

@Injectable()
export class AccountsRepository {
  constructor(@InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>) {}

  /**
   * Creates a new User Account
   */
  async create(account: Account): Promise<Account> {
    return new this.accountModel(account).save();
  }

  /**
   * Finds all user accounts
   */
  async findAll(): Promise<Account[]> {
    return this.accountModel.find().exec();
  }

  /**
   * Finds an account by ID
   */
  async findById(id: string): Promise<Account | null> {
    return this.accountModel.findOne({ accountId: id }).exec();
  }

  /**
   * Finds an account by Member ID
   */
  async findByMemberId(memberId: string): Promise<Account | null> {
    const objectId = new mongoose.Types.ObjectId(memberId);
    return this.accountModel.findOne({ memberId: objectId }).exec();
  }

  /**
   * Updates an account by ID
   */
  async update(id: string, updateData: Partial<Account>): Promise<Account | null> {
    return this.accountModel.findOneAndUpdate({ accountId: id }, updateData, { new: true }).exec();
  }

  /**
   * Deletes an account by ID
   */
  async delete(id: string): Promise<Account | null> {
    return this.accountModel.findOneAndDelete({ accountId: id }).exec();
  }
}
