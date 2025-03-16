import { Injectable, NotFoundException } from '@nestjs/common';
import { IFamiliesService } from './families.service.interface';
import { FamilyDTO } from '../dto/response/family.dto';
import { Promise } from 'mongoose';
import { CreateFamilyDto } from '../dto/request/create-family.dto';
import { FamiliesRepository } from '../repository/families.repository';
import { UpdateFamilyDto } from '../dto/request/update-family.dto';
import { AccountsService } from '../../accounts/service/accounts.service';
import { searchFamilyDTO } from '../dto/request/search-family.dto';
import { MembersRepository } from '../../members/repository/members.repository';

@Injectable()
export class FamiliesService implements IFamiliesService {
  constructor(
    private readonly familiesRepository: FamiliesRepository,
    private readonly accountsService: AccountsService,
    private readonly membersRepository: MembersRepository
  ) {
  }

  async getAllFamilies(): Promise<FamilyDTO[]> {
    const families = await this.familiesRepository.findAll();
    return families.map(FamilyDTO.map);
  }

  async createFamily(createFamilyDto: CreateFamilyDto): Promise<FamilyDTO> {
    console.log("createFamilyDto: ", createFamilyDto);
    const createdFamily = await this.familiesRepository.create(createFamilyDto);
    return  FamilyDTO.map(createdFamily);
  }

  async getFamilyById(id: string): Promise<FamilyDTO> {
    const family = await this.familiesRepository.findById(id);
    if (!family) {
      throw new NotFoundException('Family not found');
    }
    return FamilyDTO.map(family);
  }

  async updateFamily(id: string, updateData: Partial<UpdateFamilyDto>): Promise<FamilyDTO> {
    const updatedFamily = await this.familiesRepository.update(id, updateData);
    if (!updatedFamily) {
      throw new NotFoundException('Family not found');
    }
    return FamilyDTO.map(updatedFamily);
  }

  async deleteFamily(id: string): Promise<boolean> {
    const isDeleted = await this.familiesRepository.delete(id);
    if (!isDeleted) {
      throw new NotFoundException('Family not found');
    }
    return true;
  }

  async searchFamilies(searchDTO: searchFamilyDTO): Promise<FamilyDTO[]> {
    // Lấy tất cả gia đình
    const families = await this.getAllFamilies();
    const result: FamilyDTO[] = [];

    for (const family of families) {
      // Lấy thông tin tài khoản của leader gia đình
      const familyLeaderAccount = await this.accountsService.getAccountById(String(family.adminAccountId));
      const quantity = (await this.membersRepository.findMembersInFamily(family.familyId)).length;
      family.username = familyLeaderAccount.username;
      family.quantity = quantity;
      result.push(family);
    }

    return result;
  }

  async getFamilyByAdminAccountId(id: string): Promise<FamilyDTO> {
    const family = await this.familiesRepository.findByAdminAccountId(id);
    if (!family) {
      throw new NotFoundException('Family not found');
    }
    return FamilyDTO.map(family);
  }
}
