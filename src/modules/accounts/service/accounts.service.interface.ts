import { CreateAccountDto } from '../dto/request/create-account.dto';
import { UpdateAccountDto } from '../dto/request/update-account.dto';
import { AccountResponseDto } from '../dto/response/account.dto';

export interface IAccountService {
  createAccount(dto: CreateAccountDto): Promise<AccountResponseDto>;

  getAllAccounts(): Promise<AccountResponseDto[]>;

  getAccountById(id: string): Promise<AccountResponseDto>;

  getAccountByMemberId(memberId: string): Promise<AccountResponseDto | null>;

  updateAccount(id: string, dto: UpdateAccountDto): Promise<AccountResponseDto>;

  deleteAccount(id: string): Promise<AccountResponseDto>;
}
