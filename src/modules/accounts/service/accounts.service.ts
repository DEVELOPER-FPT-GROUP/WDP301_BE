import { BadRequestException, ConflictException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { IAccountService } from './accounts.service.interface';
import { AccountsRepository } from '../repository/accounts.repository';
import { CreateAccountDto } from '../dto/request/create-account.dto';
import { UpdateAccountDto } from '../dto/request/update-account.dto';
import { AccountResponseDto } from '../dto/response/account.dto';
import { AccountMapper } from '../mapper/account.mapper';
import { Promise } from 'mongoose';
import { SearchAccountDto } from '../dto/request/search-account.dto';
import { PaginationDTO } from 'src/utils/pagination.dto';
import { Role } from '../../../utils/enum';
import { TrackingsService } from 'src/modules/tracking/service/tracking.service';
import { MembersRepository } from '../../members/repository/members.repository';
import { ChangePasswordDto } from '../dto/request/change-password.dto';

@Injectable()
export class AccountsService implements IAccountService {
  constructor(
    private readonly accountsRepository: AccountsRepository,
    @Inject(forwardRef(() => TrackingsService))
    private readonly trackingsService: TrackingsService,
    private readonly membersRepository: MembersRepository,
  ) {
    this.ensureAdminAccount(); // Ensure admin account on service initialization
  }

  /**
   * Ensures an admin account exists; if not, it creates one.
   */
  private async ensureAdminAccount(): Promise<void> {
    const existingAdmin = await this.accountsRepository.findAdminAccount();

    if (!existingAdmin) {
      const adminAccountDto: CreateAccountDto = {
        username: 'admin',
        passwordHash: "admin",
        email: 'admin@example.com', // Optional
        isAdmin: true,
        role: Role.SYSTEM_ADMIN,
        memberId: "",
      };

      try {
        await this.createAccount(adminAccountDto);
      } catch (error) {
        console.log(error);
      }
    }
  }

  async getAccountsWithPagination(searchDto: SearchAccountDto): Promise<PaginationDTO<AccountResponseDto>> {
    const { page = 1, limit = 10, search, isAdmin, familyId } = searchDto;

    const filters: any = {};

    if (isAdmin !== undefined) {
      filters.isAdmin = isAdmin;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filters.$or = [{ username: regex }, { email: regex }];
    }

    // 🔍 Tìm theo familyId thông qua liên kết với Member
    if (familyId) {
      const members = await this.membersRepository.findMembersInFamily(familyId);
      const memberIds = members.map(m => m._id); // ✅ Lấy ra danh sách _id

      if (memberIds.length === 0) {
        return PaginationDTO.create([], 0, page, limit); // không có member nào thuộc family
      }
      filters.memberId = { $in: memberIds };
    }

    const { records, total } = await this.accountsRepository.findAndCount(filters, page, limit);

    if (records.length === 0) return PaginationDTO.create([], 0, page, limit);

    return PaginationDTO.create(
      records.map((account) => AccountMapper.toResponseDto(account)),
      total,
      page,
      limit
    );
  }


  /**
   * Creates a new account, ensuring a unique username if already exists.
   * @param dto - The account creation DTO.
   * @returns The created account response DTO.
   */
  // async createAccount(dto: CreateAccountDto): Promise<AccountResponseDto> {
  //   console.log("check dto", dto.passwordHash);
  //   const hashedPassword = await bcrypt.hash(dto.passwordHash, 10);

  //   // Generate a unique username
  //   const uniqueUsername = await this.generateUniqueUsername(dto.username);

  //   // Create account with hashed password and unique username
  //   const accountEntity = AccountMapper.toEntity({ ...dto, username: uniqueUsername, passwordHash: hashedPassword });

  //   // Save account through repository
  //   const savedAccount = await this.accountsRepository.create(accountEntity);
  //   await this.trackingsService.updateAccountStats();
  //   return AccountMapper.toResponseDto(savedAccount);
  // }

  async createAccount(dto: CreateAccountDto): Promise<AccountResponseDto> {
    // Ensure password is defined and a string
    if (!dto.passwordHash || typeof dto.passwordHash !== 'string') {
      throw new Error('Password is required and must be a string.');
    }

    const hashedPassword = await bcrypt.hash(dto.passwordHash, 10);

    // Generate a unique username
    const uniqueUsername = await this.generateUniqueUsername(dto.username);

    // Create account with hashed password and unique username
    const accountEntity = AccountMapper.toEntity({
      ...dto,
      username: uniqueUsername,
      passwordHash: hashedPassword
    });

    // Save account through repository
    const savedAccount = await this.accountsRepository.create(accountEntity);
    await this.trackingsService.updateAccountStats();

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

  async createFamilyLeaderAccount(createAccountDto: CreateAccountDto): Promise<AccountResponseDto> {
    if (!createAccountDto.username) {
      throw new NotFoundException('Username is required');
    }

    const isExistAccount = await this.accountsRepository.existsByUsername(createAccountDto.username);

    if (isExistAccount) {
      throw new ConflictException('Username already exists');
    }

    return await this.createAccount(createAccountDto)
  }

  async getTotalAccountsCreated(year: number, month: number): Promise<number> {
    return (await this.accountsRepository.findAccountsByMonth(year, month)).length;
  }

  async changePassword(memberId: string, dto: ChangePasswordDto): Promise<boolean> {
    const account = await this.accountsRepository.findByMemberId(memberId);
    if (!account) throw new NotFoundException('Không tìm thấy tài khoản');

    const isMatch = await bcrypt.compare(dto.oldPassword, account.passwordHash);
    if (!isMatch) throw new BadRequestException('Mật khẩu cũ không chính xác');

    const isSamePassword = await bcrypt.compare(dto.newPassword, account.passwordHash);
    if (isSamePassword) throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu cũ');

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.accountsRepository.update(account._id.toString(), {
      passwordHash: hashedNewPassword,
    });

    return true;
  }
}
