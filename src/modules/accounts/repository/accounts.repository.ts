import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { Account, AccountDocument } from '../schema/account.schema';

@Injectable()
export class AccountsRepository {
  constructor(@InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>) {}

  /**
   * Creates a new account in the database.
   * @param account - The account entity to be saved.
   * @returns The created account document.
   */
  async create(account: Account): Promise<Account> {
    return new this.accountModel(account).save();
  }

  /**
   * Retrieves all accounts from the database.
   * @returns An array of all accounts.
   */
  async findAll(): Promise<Account[]> {
    return this.accountModel.find().exec();
  }

  /**
   * Finds an account by its MongoDB `_id`.
   * @param id - The unique identifier of the account.
   * @returns The account document or null if not found.
   */
  async findById(id: string): Promise<Account | null> {
    const objectId = new mongoose.Types.ObjectId(id);
    return this.accountModel.findOne({ _id: objectId }).exec();
  }

  /**
   * Finds an account by the associated `memberId`.
   * @param memberId - The unique member ID.
   * @returns The account document or null if not found.
   */
  async findByMemberId(memberId: string): Promise<Account | null> {
    return this.accountModel.findOne({ memberId: new mongoose.Types.ObjectId(memberId) }).exec();
  }

  /**
   * Finds an account by its `username`.
   * @param username - The unique username.
   * @returns The account document or null if not found.
   */
  async findByUsername(username: string): Promise<Account | null> {
    return this.accountModel.findOne({ username }).exec();
  }

  /**
   * Checks if an account with the given username already exists.
   * @param username - The username to check.
   * @returns `true` if username exists, otherwise `false`.
   */
  async existsByUsername(username: string): Promise<boolean> {
    return !!(await this.accountModel.exists({ username }));
  }

  /**
   * Updates an account by its `_id`.
   * @param id - The unique identifier of the account.
   * @param updateData - The partial account data to update.
   * @returns The updated account document or null if not found.
   */
  async update(id: string, updateData: Partial<Account>): Promise<Account | null> {
    const objectId = new mongoose.Types.ObjectId(id);
    return this.accountModel
      .findOneAndUpdate({ _id: objectId }, updateData, { new: true })
      .exec();
  }

  /**
   * Deletes an account by its `_id`.
   * @param id - The unique identifier of the account.
   * @returns The deleted account document or null if not found.
   */
  async delete(id: string): Promise<Account | null> {
    const objectId = new mongoose.Types.ObjectId(id);
    return this.accountModel.findOneAndDelete({ _id: objectId }).exec();
  }

  /**
   * Updates the refresh token for an account (Used for token rotation).
   * @param memberId - The unique member ID.
   * @param refreshToken - The new refresh token, or `null` to remove it.
   */
  async updateRefreshToken(memberId: string, refreshToken: string | null): Promise<void> {
    await this.accountModel
      .findOneAndUpdate({ memberId: new mongoose.Types.ObjectId(memberId) }, { refreshToken })
      .exec();
  }

  /**
   * Finds an account by its refresh token.
   * @param refreshToken - The refresh token.
   * @returns The account document or null if not found.
   */
  async findByRefreshToken(refreshToken: string): Promise<Account | null> {
    return this.accountModel.findOne({ refreshToken }).exec();
  }
}
