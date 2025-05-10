import { FamilyDTO } from '../dto/response/family.dto';
import { CreateFamilyDto } from '../dto/request/create-family.dto';
import { UpdateFamilyDto } from '../dto/request/update-family.dto';
import { Promise } from 'mongoose';
import { AccountResponseDto } from '../../accounts/dto/response/account.dto';
import { searchFamilyDTO } from '../dto/request/search-family.dto';

export interface IFamiliesService {
  createFamily(createFamilyDto: CreateFamilyDto): Promise<FamilyDTO>;
  getFamilyById(id: string): Promise<FamilyDTO>;
  updateFamily(id: string, updateData: Partial<UpdateFamilyDto>): Promise<FamilyDTO>;
  deleteFamily(id: string): Promise<boolean>;
  searchFamilies(searchDTO: searchFamilyDTO): Promise<FamilyDTO[]>
}
