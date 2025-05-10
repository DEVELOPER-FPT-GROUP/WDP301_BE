import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateParentChildRelationshipDto } from '../dto/request/create-parent-child-relationship.dto';
import { ParentChildRelationshipDTO } from '../dto/response/parent-child-relationship.dto';
import { UpdateParentChildRelationshipDto } from '../dto/request/update-parent-child-relationship.dto';
import { ParentChildRelationshipsRepository } from '../repository/parent-child-relationships.repository';
import { IParentChildRelationshipsService } from './parent-child-relationships.service.interface';
import { Promise } from 'mongoose';

@Injectable()
export class ParentChildRelationshipsService implements IParentChildRelationshipsService {
  constructor(private readonly parentChildRelationshipsRepository: ParentChildRelationshipsRepository) {}

  async createRelationship(dto: CreateParentChildRelationshipDto): Promise<ParentChildRelationshipDTO> {
    const createdRelationship = await this.parentChildRelationshipsRepository.create(dto);
    return ParentChildRelationshipDTO.map(createdRelationship);
  }

  async getRelationshipById(id: string): Promise<ParentChildRelationshipDTO> {
    const relationship = await this.parentChildRelationshipsRepository.findById(id);
    if (!relationship) {
      throw new NotFoundException('Relationship not found');
    }
    return ParentChildRelationshipDTO.map(relationship);
  }

  async findAllRelationships(): Promise<ParentChildRelationshipDTO[]> {
    const relationships = await this.parentChildRelationshipsRepository.findAll();
    return relationships.map(relationship => ParentChildRelationshipDTO.map(relationship));
  }

  async updateRelationship(id: string, updateData: UpdateParentChildRelationshipDto): Promise<ParentChildRelationshipDTO> {
    const updatedRelationship = await this.parentChildRelationshipsRepository.update(id, updateData);
    if (!updatedRelationship) {
      throw new NotFoundException('Relationship not found');
    }
    return ParentChildRelationshipDTO.map(updatedRelationship);
  }

  async deleteRelationship(id: string): Promise<boolean> {
    const isDeleted = await this.parentChildRelationshipsRepository.delete(id);
    if (!isDeleted) {
      throw new NotFoundException('Relationship not found');
    }
    return true;
  }

  findByChildIds(childIds: string[]): Promise<ParentChildRelationshipDTO[]> {
    if (!childIds.length)
      return Promise.resolve([]);

    return this.parentChildRelationshipsRepository
      .findByChildIds(childIds)
      .then(relationships => relationships.map(relationship => ParentChildRelationshipDTO.map(relationship)));
  }

  findByParentIds(parentIds: string[]): Promise<ParentChildRelationshipDTO[]> {
    if (!parentIds.length)
      return Promise.resolve([]);

    return this.parentChildRelationshipsRepository
      .findByParentIds(parentIds)
      .then(relationships => relationships.map(relationship => ParentChildRelationshipDTO.map(relationship)));
  }

}
