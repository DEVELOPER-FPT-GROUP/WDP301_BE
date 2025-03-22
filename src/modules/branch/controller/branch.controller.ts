import { Body, Controller, Delete, Get, Param, Patch, Post, UseInterceptors } from '@nestjs/common';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { BranchService } from '../service/branch.service';
import { CreateBranchDto } from '../dto/request/create-branch.dto';
import { UpdateBranchDto } from '../dto/request/update-branch.dto';
import { ResponseDTO } from 'src/utils/response.dto';
import { BranchResponseDto } from '../dto/response/branch.dto';

@UseInterceptors(LoggingInterceptor)
@Controller('branches')
export class BranchController {
  constructor(private readonly branchService: BranchService) {}

  @Post()
  async create(@Body() dto: CreateBranchDto): Promise<ResponseDTO<BranchResponseDto>> {
    const result = await this.branchService.createBranch(dto);
    return ResponseDTO.success(result, 'Branch created successfully');
  }

  @Get()
  async getAll(): Promise<ResponseDTO<BranchResponseDto[]>> {
    const result = await this.branchService.getAllBranches();
    return ResponseDTO.success(result, 'Branches fetched successfully');
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<ResponseDTO<BranchResponseDto>> {
    const result = await this.branchService.getBranchById(id);
    return ResponseDTO.success(result, `Branch with ID ${id} fetched`);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateBranchDto): Promise<ResponseDTO<BranchResponseDto>> {
    const result = await this.branchService.updateBranch(id, dto);
    return ResponseDTO.success(result, `Branch with ID ${id} updated`);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ResponseDTO<BranchResponseDto>> {
    const result = await this.branchService.deleteBranch(id);
    return ResponseDTO.success(result, `Branch with ID ${id} deleted`);
  }
}
