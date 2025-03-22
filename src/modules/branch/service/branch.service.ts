import { Injectable, NotFoundException } from '@nestjs/common';
import { BranchRepository } from '../repository/branch.repository';
import { IBranchService } from './branch.service.interface';
import { CreateBranchDto } from '../dto/request/create-branch.dto';
import { UpdateBranchDto } from '../dto/request/update-branch.dto';
import { BranchResponseDto } from '../dto/response/branch.dto';
import { BranchMapper } from '../mapper/branch.mapper';

@Injectable()
export class BranchService implements IBranchService {
  constructor(private readonly branchRepository: BranchRepository) {}

  async createBranch(dto: CreateBranchDto): Promise<BranchResponseDto> {
    const entity = BranchMapper.toEntity(dto);
    const created = await this.branchRepository.create(entity);
    return BranchMapper.toResponseDto(created);
  }

  async getAllBranches(): Promise<BranchResponseDto[]> {
    const branches = await this.branchRepository.findAll();
    return branches.map(BranchMapper.toResponseDto);
  }

  async getBranchById(id: string): Promise<BranchResponseDto> {
    const branch = await this.branchRepository.findById(id);
    if (!branch) throw new NotFoundException(`Branch with ID ${id} not found`);
    return BranchMapper.toResponseDto(branch);
  }

  async updateBranch(id: string, dto: UpdateBranchDto): Promise<BranchResponseDto> {
    const updated = await this.branchRepository.update(id, BranchMapper.toUpdateEntity(dto));
    if (!updated) throw new NotFoundException(`Branch with ID ${id} not found`);
    return BranchMapper.toResponseDto(updated);
  }

  async deleteBranch(id: string): Promise<BranchResponseDto> {
    const deleted = await this.branchRepository.delete(id);
    if (!deleted) throw new NotFoundException(`Branch with ID ${id} not found`);
    return BranchMapper.toResponseDto(deleted);
  }
}
