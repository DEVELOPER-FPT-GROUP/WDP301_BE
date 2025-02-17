import { Injectable, NotFoundException } from '@nestjs/common';
import { IMarriagesService } from './marriages.service.interface';
import { CreateMarriageDto } from '../dto/request/create-marriage.dto';
import { MarriageDTO } from '../dto/response/marriage.dto';
import { MarriagesRepository } from '../repository/marriages.repository';
import { UpdateMarriageDto } from '../dto/request/update-marriage.dto';

@Injectable()
export class MarriagesService implements IMarriagesService {
  constructor(private readonly marriagesRepository: MarriagesRepository) {}

  async createMarriage(createMarriageDto: CreateMarriageDto): Promise<MarriageDTO> {
    const createdMarriage = await this.marriagesRepository.create(createMarriageDto);
    return MarriageDTO.map(createdMarriage);
  }

  async getMarriageById(id: string): Promise<MarriageDTO> {
    const marriage = await this.marriagesRepository.findById(id);
    if (!marriage) {
      throw new NotFoundException('Marriage record not found');
    }
    return MarriageDTO.map(marriage);
  }

  async findAllMarriages(): Promise<MarriageDTO[]> {
    const marriages = await this.marriagesRepository.findAll();
    return marriages.map(marriage => MarriageDTO.map(marriage));
  }

  async updateMarriage(id: string, updateData: Partial<UpdateMarriageDto>): Promise<MarriageDTO> {
    const updatedMarriage = await this.marriagesRepository.update(id, updateData);
    if (!updatedMarriage) {
      throw new NotFoundException('Marriage record not found');
    }
    return MarriageDTO.map(updatedMarriage);
  }

  async deleteMarriage(id: string): Promise<boolean> {
    const isDeleted = await this.marriagesRepository.delete(id);
    if (!isDeleted) {
      throw new NotFoundException('Marriage record not found');
    }
    return true;
  }

  async getSpouse(memberId: string): Promise<MarriageDTO> {
    const spouse = await this.marriagesRepository.getSpouse(memberId);
    return MarriageDTO.map(spouse);
  }

  async getAllSpouses(memberIds: string[]): Promise<MarriageDTO[]> {
    const spouses = await this.marriagesRepository.getAllSpouses(memberIds);
    return spouses.map(spouse => MarriageDTO.map(spouse));
  }
}
