import { CreateHouseholdDto } from '../dto/request/create-household.dto';
import { UpdateHouseholdDto } from '../dto/request/update-household.dto';
import { HouseholdResponseDto } from '../dto/response/household.dto';

export interface IHouseholdService {
  createHousehold(dto: CreateHouseholdDto): Promise<HouseholdResponseDto>;
  getAllHouseholds(): Promise<HouseholdResponseDto[]>;
  getHouseholdById(id: string): Promise<HouseholdResponseDto>;
  updateHousehold(id: string, dto: UpdateHouseholdDto): Promise<HouseholdResponseDto>;
  deleteHousehold(id: string): Promise<HouseholdResponseDto>;
  getHouseholdsByBranch(branchId: string): Promise<HouseholdResponseDto[]>;
}
