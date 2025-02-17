import { Injectable, NotFoundException } from '@nestjs/common';
import { IRelationshipTypesService } from './relationship-types.service.interface';
import { CreateRelationshipTypeDto } from '../dto/request/create-relationship-type.dto';
import { RelationshipTypeDTO } from '../dto/response/relationship-type.dto';
import { RelationshipTypesRepository } from '../repository/relationship-types.repository';

@Injectable()
export class RelationshipTypesService implements IRelationshipTypesService {
  constructor(private readonly relationshipTypesRepo: RelationshipTypesRepository) {}

  async createRelationshipType(dto: CreateRelationshipTypeDto): Promise<RelationshipTypeDTO> {
    const createdType = await this.relationshipTypesRepo.create(dto);
    return RelationshipTypeDTO.map(createdType);
  }

  async getRelationshipTypeById(id: string): Promise<RelationshipTypeDTO> {
    const type = await this.relationshipTypesRepo.findById(id);
    if (!type) {
      throw new NotFoundException('Relationship Type not found');
    }
    return RelationshipTypeDTO.map(type);
  }

  async findAllRelationshipTypes(): Promise<RelationshipTypeDTO[]> {
    const types = await this.relationshipTypesRepo.findAll();
    return types.map(type => RelationshipTypeDTO.map(type));
  }

  async deleteRelationshipType(id: string): Promise<boolean> {
    const isDeleted = await this.relationshipTypesRepo.delete(id);
    if (!isDeleted) {
      throw new NotFoundException('Relationship Type not found');
    }
    return true;
  }
}
