import {
  Controller, Get, Post, Put, Delete, Param, Body, Patch, UseInterceptors, Query,
} from '@nestjs/common';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { AccountsService } from '../service/accounts.service';
import { CreateAccountDto } from '../dto/request/create-account.dto';
import { UpdateAccountDto } from '../dto/request/update-account.dto';
import { ResponseDTO } from 'src/utils/response.dto';
import { AccountResponseDto } from '../dto/response/account.dto';

@UseInterceptors(LoggingInterceptor) // ✅ Apply logging interceptor
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  /**
   * Create a new account
   */
  @Post()
  async createAccount(@Body() createAccountDto: CreateAccountDto): Promise<ResponseDTO<AccountResponseDto>> {
    logger.http(`Received POST request to create an account for member ID: ${createAccountDto.memberId}`);
    const result = await this.accountsService.createAccount(createAccountDto);
    return ResponseDTO.success(result, 'Account created successfully');
  }

  /**
   * Get all accounts
   */
  @Get()
  async getAllAccounts(): Promise<ResponseDTO<AccountResponseDto[]>> {
    logger.http(`Received GET request to fetch all accounts`);
    const result = await this.accountsService.getAllAccounts();
    return ResponseDTO.success(result, 'Accounts fetched successfully');
  }

  /**
   * Get an account by ID
   */
  @Get(':id')
  async getAccountById(@Param('id') id: string): Promise<ResponseDTO<AccountResponseDto>> {
    logger.http(`Received GET request to fetch account with ID: ${id}`);
    const result = await this.accountsService.getAccountById(id);
    return ResponseDTO.success(result, `Account with ID ${id} retrieved successfully`);
  }

  /**
   * Get an account by Member ID
   */
  @Get('member/:memberId')
  async getAccountByMemberId(@Param('memberId') memberId: string): Promise<ResponseDTO<AccountResponseDto | null>> {
    logger.http(`Received GET request to fetch account for Member ID: ${memberId}`);
    const result = await this.accountsService.getAccountByMemberId(memberId);
    return ResponseDTO.success(result, `Account for Member ID ${memberId} retrieved successfully`);
  }

  /**
   * Update an account by ID
   */
  @Patch(':id')
  async updateAccount(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto): Promise<ResponseDTO<AccountResponseDto>> {
    logger.http(`Received PATCH request to update account with ID: ${id}`);
    const result = await this.accountsService.updateAccount(id, updateAccountDto);
    return ResponseDTO.success(result, `Account with ID ${id} updated successfully`);
  }

  /**
   * Delete an account by ID
   */
  @Delete(':id')
  async deleteAccount(@Param('id') id: string): Promise<ResponseDTO<AccountResponseDto>> {
    logger.http(`Received DELETE request to remove account with ID: ${id}`);
    const result = await this.accountsService.deleteAccount(id);
    return ResponseDTO.success(result, `Account with ID ${id} deleted successfully`);
  }

  /**
   * API to get total accounts created in a specific month and year.
   * Example: GET /accounts/total-created?year=2025&month=3
   */
  @Get('total-created')
  async getTotalCreatedAccounts(
    @Query() searchQuery: { year: string; month: string },
  ): Promise<{ total: number }> {
    const yearNum = parseInt(searchQuery.year, 10);
    const monthNum = parseInt(searchQuery.month, 10);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new Error('Invalid year or month');
    }

    const total = await this.accountsService.getTotalAccountsCreated(yearNum, monthNum);
    return { total };
  }
}
