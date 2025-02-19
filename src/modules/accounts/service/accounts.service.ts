import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { IAccountService } from './accounts.service.interface';
import { Account, AccountDocument } from '../schema/account.schema';
import { CreateAccountDto } from '../dto/request/create-account.dto';
import { UpdateAccountDto } from '../dto/request/update-account.dto';
import { AccountMapper } from '../mapper/account.mapper';
import * as bcrypt from 'bcryptjs';
import { AccountResponseDto } from '../dto/response/account.dto';

@Injectable()
export class AccountsService implements IAccountService {
  constructor(@InjectModel(Account.name) private readonly accountModel: Model<AccountDocument>) {}

  /**
   * Creates a new account, ensuring a unique username if already exists
   */
  async createAccount(dto: CreateAccountDto): Promise<AccountResponseDto> {
    const hashedPassword = await bcrypt.hash(dto.passwordHash, 10);

    // Generate a unique username
    const uniqueUsername = await this.generateUniqueUsername(dto.username);

    // Create account entity with unique username
    const newAccount = new this.accountModel(
      AccountMapper.toEntity({ ...dto, username: uniqueUsername, passwordHash: hashedPassword })
    );

    const savedAccount = await newAccount.save();
    return AccountMapper.toResponseDto(savedAccount);
  }

  /**
   * Generates a unique username by appending an incrementing index
   */
  private async generateUniqueUsername(username: string): Promise<string> {
    let newUsername = username;
    let index = 1;

    while (await this.accountModel.exists({ username: newUsername })) {
      newUsername = `${username}${index.toString().padStart(2, '0')}`; // Formats as 'john01'
      index++;
    }

    return newUsername;
  }

  async getAllAccounts(): Promise<AccountResponseDto[]> {
    const accounts = await this.accountModel.find().exec();
    return accounts.map(AccountMapper.toResponseDto);
  }

  async getAccountById(id: string): Promise<AccountResponseDto> {
    const account = await this.accountModel.findOne({ accountId: id }).exec();
    if (!account) throw new NotFoundException(`Account with ID ${id} not found`);
    return AccountMapper.toResponseDto(account);
  }

  async getAccountByMemberId(memberId: string): Promise<AccountResponseDto | null> {
    const account = await this.accountModel.findOne({ memberId }).exec();
    return account ? AccountMapper.toResponseDto(account) : null;
  }

  async updateAccount(id: string, dto: UpdateAccountDto): Promise<AccountResponseDto> {
    const updatedAccount = await this.accountModel.findOneAndUpdate(
      { accountId: id },
      AccountMapper.toUpdateEntity(dto),
      { new: true },
    ).exec();

    if (!updatedAccount) throw new NotFoundException(`Account with ID ${id} not found`);
    return AccountMapper.toResponseDto(updatedAccount);
  }

  async deleteAccount(id: string): Promise<AccountResponseDto> {
    const deletedAccount = await this.accountModel.findOneAndDelete({ accountId: id }).exec();
    if (!deletedAccount) throw new NotFoundException(`Account with ID ${id} not found`);
    return AccountMapper.toResponseDto(deletedAccount);
  }
}
