import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { HouseholdService } from '../service/household.service';
import { CreateHouseholdDto } from '../dto/request/create-household.dto';
import { UpdateHouseholdDto } from '../dto/request/update-household.dto';
import { HouseholdResponseDto } from '../dto/response/household.dto';
import { ResponseDTO } from 'src/utils/response.dto';

@UseInterceptors(LoggingInterceptor)
@Controller('households')
export class HouseholdController {
  constructor(private readonly service: HouseholdService) {}

  @Post()
  async create(@Body() dto: CreateHouseholdDto): Promise<ResponseDTO<HouseholdResponseDto>> {
    const result = await this.service.createHousehold(dto);
    return ResponseDTO.success(result, 'Household created successfully');
  }

  @Get()
  async getAll(): Promise<ResponseDTO<HouseholdResponseDto[]>> {
    const result = await this.service.getAllHouseholds();
    return ResponseDTO.success(result, 'All households fetched');
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ResponseDTO<HouseholdResponseDto>> {
    const result = await this.service.getHouseholdById(id);
    return ResponseDTO.success(result, 'Household fetched by ID');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateHouseholdDto
  ): Promise<ResponseDTO<HouseholdResponseDto>> {
    const result = await this.service.updateHousehold(id, dto);
    return ResponseDTO.success(result, 'Household updated');
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ResponseDTO<HouseholdResponseDto>> {
    const result = await this.service.deleteHousehold(id);
    return ResponseDTO.success(result, 'Household deleted');
  }

  @Get('branch/:branchId')
  async getByBranch(@Param('branchId') branchId: string): Promise<ResponseDTO<HouseholdResponseDto[]>> {
    const result = await this.service.getHouseholdsByBranch(branchId);
    return ResponseDTO.success(result, `Households of branch ${branchId} fetched`);
  }
}
