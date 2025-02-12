import { FamilyResponse } from '../dto/response/family.dto';
import { CreateFamilyDto } from '../dto/request/create-family.dto';

export interface IFamiliesService {
  createFamily(createFamilyDto: CreateFamilyDto): Promise<FamilyResponse>;
  getFamilyById(id: string): Promise<FamilyResponse>;
  updateFamily(id: string, updateData: Partial<CreateFamilyDto>): Promise<FamilyResponse>;
  deleteFamily(id: string): Promise<boolean>;
}
