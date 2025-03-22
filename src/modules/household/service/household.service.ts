import { Injectable, NotFoundException } from '@nestjs/common';
import { IHouseholdService } from './household.service.interface';
import { HouseholdRepository } from '../repository/household.repository';
import { CreateHouseholdDto } from '../dto/request/create-household.dto';
import { UpdateHouseholdDto } from '../dto/request/update-household.dto';
import { HouseholdResponseDto } from '../dto/response/household.dto';
import { HouseholdMapper } from '../mapper/household.mapper';

@Injectable()
export class HouseholdService implements IHouseholdService {
  constructor(private readonly repo: HouseholdRepository) {}

  async createHousehold(dto: CreateHouseholdDto): Promise<HouseholdResponseDto> {
    const entity = HouseholdMapper.toEntity(dto);
    const saved = await this.repo.create(entity);
    return HouseholdMapper.toResponseDto(saved);
  }

  async getAllHouseholds(): Promise<HouseholdResponseDto[]> {
    const households = await this.repo.findAll();
    return households.map(HouseholdMapper.toResponseDto);
  }

  async getHouseholdById(id: string): Promise<HouseholdResponseDto> {
    const household = await this.repo.findById(id);
    if (!household) throw new NotFoundException(`Household with ID ${id} not found`);
    return HouseholdMapper.toResponseDto(household);
  }

  async updateHousehold(id: string, dto: UpdateHouseholdDto): Promise<HouseholdResponseDto> {
    const updated = await this.repo.update(id, HouseholdMapper.toUpdateEntity(dto));
    if (!updated) throw new NotFoundException(`Household with ID ${id} not found`);
    return HouseholdMapper.toResponseDto(updated);
  }

  async deleteHousehold(id: string): Promise<HouseholdResponseDto> {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundException(`Household with ID ${id} not found`);
    return HouseholdMapper.toResponseDto(deleted);
  }

  async getHouseholdsByBranch(branchId: string): Promise<HouseholdResponseDto[]> {
    const households = await this.repo.findByBranchId(branchId);
    return households.map(HouseholdMapper.toResponseDto);
  }
}
