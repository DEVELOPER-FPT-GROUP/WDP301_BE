import { CreateAccountDto } from '../dto/request/create-account.dto';
import { SearchAccountDto } from '../dto/request/search-account.dto';
import { UpdateAccountDto } from '../dto/request/update-account.dto';
import { AccountResponseDto } from '../dto/response/account.dto';
import { Promise } from 'mongoose';
import { PaginationDTO } from '../../../utils/pagination.dto';

export interface IAccountService {
  createAccount(dto: CreateAccountDto): Promise<AccountResponseDto>;

  getAllAccounts(): Promise<AccountResponseDto[]>;

  getAccountById(id: string): Promise<AccountResponseDto>;

  getAccountByMemberId(memberId: string): Promise<AccountResponseDto | null>;

  updateAccount(id: string, dto: UpdateAccountDto): Promise<AccountResponseDto>;

  deleteAccount(id: string): Promise<AccountResponseDto>;

  createFamilyLeaderAccount(createAccountDto: CreateAccountDto): Promise<AccountResponseDto>;

  getAccountsWithPagination(searchDto: SearchAccountDto): Promise<PaginationDTO<AccountResponseDto>>;

  getTotalAccountsCreated(year: number, month: number): Promise<number>
}
