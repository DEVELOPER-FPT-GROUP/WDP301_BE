import mongoose from 'mongoose';
import { Account } from '../schema/account.schema';
import { CreateAccountDto } from '../dto/request/create-account.dto';
import { UpdateAccountDto } from '../dto/request/update-account.dto';
import { AccountResponseDto } from '../dto/response/account.dto';

export class AccountMapper {
  /**
   * Converts Create DTO to Account Entity
   */
  static toEntity(dto: CreateAccountDto): Account {
    return {
      _id: new mongoose.Types.ObjectId(),
      memberId: new mongoose.Types.ObjectId(dto.memberId), // ✅ Store as ObjectId
      username: dto.username,
      passwordHash: dto.passwordHash,
      email: dto.email,
      isAdmin: dto.isAdmin || false,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Account;
  }

  /**
   * Converts Update DTO to Partial Entity (for updating)
   */
  static toUpdateEntity(dto: UpdateAccountDto): Partial<Account> {
    const updateData: Partial<Account> = {};

    if (dto.username) updateData.username = dto.username;
    if (dto.passwordHash) updateData.passwordHash = dto.passwordHash;
    if (dto.email) updateData.email = dto.email;
    if (typeof dto.isAdmin !== 'undefined') updateData.isAdmin = dto.isAdmin;

    updateData.updatedAt = new Date();
    return updateData;
  }

  /**
   * Converts Database Entity to Response DTO
   */
  static toResponseDto(account: Account): AccountResponseDto {
    return {
      accountId: account._id.toString(),
      memberId: account.memberId.toString(),
      username: account.username,
      email: account.email,
      isAdmin: account.isAdmin,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt,
    };
  }
}
