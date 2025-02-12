import { Injectable, NotFoundException } from '@nestjs/common';
import { IFamiliesService } from './families.service.interface';
import { FamilyDTO, FamilyResponse } from '../dto/response/family.dto';
import { Promise } from 'mongoose';
import { CreateFamilyDto } from '../dto/request/create-family.dto';
import { FamiliesRepository } from '../repository/families.repository';

@Injectable()
export class FamiliesService implements IFamiliesService {
  constructor(
    private readonly familiesRepository: FamiliesRepository
  ) {
  }
  async createFamily(createFamilyDto: CreateFamilyDto): Promise<FamilyResponse> {
    console.log("createFamilyDto: ", createFamilyDto);
    const createdFamily = await this.familiesRepository.create(createFamilyDto);
    const familyDTO = FamilyDTO.map(createdFamily);
    return { family: familyDTO };
  }

  async getFamilyById(id: string): Promise<FamilyResponse> {
    const family = await this.familiesRepository.findById(id);
    if (!family) {
      throw new NotFoundException('Family not found');
    }
    return { family: FamilyDTO.map(family) };
  }

  async updateFamily(id: string, updateData: Partial<CreateFamilyDto>): Promise<FamilyResponse> {
    const updatedFamily = await this.familiesRepository.update(id, updateData);
    if (!updatedFamily) {
      throw new NotFoundException('Family not found');
    }
    return { family: FamilyDTO.map(updatedFamily) };
  }

  async deleteFamily(id: string): Promise<boolean> {
    const isDeleted = await this.familiesRepository.delete(id);
    if (!isDeleted) {
      throw new NotFoundException('Family not found');
    }
    return true;
  }

}
