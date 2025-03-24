import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import mongoose from 'mongoose';
import { Account, AccountDocument } from '../schema/account.schema';
import { Role } from '../../../utils/enum';

@Injectable()
export class AccountsRepository {
  constructor(
    @InjectModel(Account.name)
    private readonly accountModel: Model<AccountDocument>,
  ) {}

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
    return this.accountModel
      .findOne({ memberId: new mongoose.Types.ObjectId(memberId) })
      .exec();
  }

  /**
   * Finds an account by its `username`.
   * @param username - The unique username.
   * @returns The account document or null if not found.
   */
  async findByUsername(username: string): Promise<Account | null> {
    // console.log('Find account by username: ', username);
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
  async update(
    id: string,
    updateData: Partial<Account>,
  ): Promise<Account | null> {
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
  async updateRefreshToken(
    accountId: string,
    refreshToken: string | null,
  ): Promise<void> {
    await this.accountModel
      .findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(accountId) },
        { refreshToken },
      )
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

  async findByFilters(
    filters: any,
    page: number,
    limit: number,
  ): Promise<{ accounts: Account[]; total: number }> {
    const skip = (page - 1) * limit;

    const [accounts, total] = await Promise.all([
      this.accountModel.find(filters).skip(skip).limit(limit).exec(),
      this.accountModel.countDocuments(filters).exec(),
    ]);

    console.log('Accounts: ', accounts);

    return { accounts, total };
  }

  async findAndCount(
    filters: any,
    page: number,
    limit: number,
  ): Promise<{ records: Account[]; total: number }> {
    const skip = (page - 1) * limit;

    const [records, total] = await Promise.all([
      this.accountModel.find(filters).skip(skip).limit(limit).exec(),
      this.accountModel.countDocuments(filters).exec(),
    ]);

    return { records, total };
  }

  /**
   * Counts the number of accounts created in a specific month and year.
   * @param year - The year to filter accounts.
   * @param month - The month to filter accounts (1-12).
   * @returns The total count of accounts created in the given month.
   */
  async findAccountsByMonth(year: number, month: number): Promise<Account[]> {
    // Calculate the first and last day of the given month
    const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)); // 1st day of the month
    const endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)); // Last day of the month
    console.log(startDate);
    return this.accountModel
      .find({
        createdAt: { $gte: startDate, $lte: endDate },
      })
      .exec();
  }

  async findAdminAccount(): Promise<Account | null> {
    return this.accountModel.findOne({ role: Role.SYSTEM_ADMIN }).exec();
  }
}
