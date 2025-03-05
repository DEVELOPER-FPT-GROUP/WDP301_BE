import { Injectable, NotFoundException } from '@nestjs/common';
import { IFamiliesService } from './families.service.interface';
import { FamilyDTO } from '../dto/response/family.dto';
import { Promise } from 'mongoose';
import { CreateFamilyDto } from '../dto/request/create-family.dto';
import { FamiliesRepository } from '../repository/families.repository';
import { UpdateFamilyDto } from '../dto/request/update-family.dto';

@Injectable()
export class FamiliesService implements IFamiliesService {
  constructor(
    private readonly familiesRepository: FamiliesRepository
  ) {
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

}
