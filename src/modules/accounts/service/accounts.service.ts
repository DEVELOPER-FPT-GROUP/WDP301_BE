import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IAccountService } from './accounts.service.interface';
import { AccountsRepository } from '../repository/accounts.repository';
import { CreateAccountDto } from '../dto/request/create-account.dto';
import { UpdateAccountDto } from '../dto/request/update-account.dto';
import { AccountResponseDto } from '../dto/response/account.dto';
import { AccountMapper } from '../mapper/account.mapper';

@Injectable()
export class AccountsService implements IAccountService {
  constructor(private readonly accountsRepository: AccountsRepository) {}

  /**
   * Creates a new account, ensuring a unique username if already exists.
   * @param dto - The account creation DTO.
   * @returns The created account response DTO.
   */
  async createAccount(dto: CreateAccountDto): Promise<AccountResponseDto> {
    const hashedPassword = await bcrypt.hash(dto.passwordHash, 10);

    // Generate a unique username
    const uniqueUsername = await this.generateUniqueUsername(dto.username);

    // Create account with hashed password and unique username
    const accountEntity = AccountMapper.toEntity({ ...dto, username: uniqueUsername, passwordHash: hashedPassword });

    // Save account through repository
    const savedAccount = await this.accountsRepository.create(accountEntity);
    return AccountMapper.toResponseDto(savedAccount);
  }

  /**
   * Generates a unique username by appending an incrementing index if necessary.
   * @param username - The desired username.
   * @returns A unique username.
   */
  private async generateUniqueUsername(username: string): Promise<string> {
    let newUsername = username;
    let index = 1;

    while (await this.accountsRepository.existsByUsername(newUsername)) {
      newUsername = `${username}${index.toString().padStart(2, '0')}`; // Formats as 'john01'
      index++;
    }

    return newUsername;
  }

  async getAllAccounts(): Promise<AccountResponseDto[]> {
    const accounts = await this.accountsRepository.findAll();
    return accounts.map(AccountMapper.toResponseDto);
  }

  async getAccountById(id: string): Promise<AccountResponseDto> {
    const account = await this.accountsRepository.findById(id);
    if (!account) throw new NotFoundException(`Account with ID ${id} not found`);
    return AccountMapper.toResponseDto(account);
  }

  async getAccountByMemberId(memberId: string): Promise<AccountResponseDto | null> {
    const account = await this.accountsRepository.findByMemberId(memberId);
    return account ? AccountMapper.toResponseDto(account) : null;
  }

  /**
   * Updates an existing account and ensures username uniqueness.
   * @param id - The unique identifier of the account.
   * @param dto - The update account DTO.
   * @returns The updated account response DTO.
   */
  async updateAccount(id: string, dto: UpdateAccountDto): Promise<AccountResponseDto> {
    const existingAccount = await this.accountsRepository.findById(id);
    if (!existingAccount) throw new NotFoundException(`Account with ID ${id} not found`);

    // If username is being updated, ensure uniqueness
    let newUsername = dto.username || existingAccount.username;
    if (dto.username && dto.username !== existingAccount.username) {
      newUsername = await this.generateUniqueUsername(dto.username);
    }

    // Hash the password if provided
    let updatedPasswordHash = existingAccount.passwordHash;
    if (dto.passwordHash) {
      updatedPasswordHash = await bcrypt.hash(dto.passwordHash, 10);
    }

    dto.username = newUsername;
    dto.passwordHash = updatedPasswordHash;

    // Update the account
    const updatedAccount = await this.accountsRepository.update(id, AccountMapper.toUpdateEntity(dto));

    if (!updatedAccount) throw new NotFoundException(`Account with ID ${id} not found`);
    return AccountMapper.toResponseDto(updatedAccount);
  }

  async deleteAccount(id: string): Promise<AccountResponseDto> {
    const deletedAccount = await this.accountsRepository.delete(id);
    if (!deletedAccount) throw new NotFoundException(`Account with ID ${id} not found`);
    return AccountMapper.toResponseDto(deletedAccount);
  }
}
