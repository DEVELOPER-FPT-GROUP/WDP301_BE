import { ParentChildRelationshipDTO } from '../dto/response/parent-child-relationship.dto';
import { CreateParentChildRelationshipDto } from '../dto/request/create-parent-child-relationship.dto';
import { UpdateParentChildRelationshipDto } from '../dto/request/update-parent-child-relationship.dto';

export interface IParentChildRelationshipsService {
  createRelationship(dto: CreateParentChildRelationshipDto): Promise<ParentChildRelationshipDTO>;
  findAllRelationships(): Promise<ParentChildRelationshipDTO[]>;
  getRelationshipById(id: string): Promise<ParentChildRelationshipDTO>;
  updateRelationship(id: string, updateData: UpdateParentChildRelationshipDto): Promise<ParentChildRelationshipDTO>;
  deleteRelationship(id: string): Promise<boolean>;
  findByParentIds(parentIds: string[]): Promise<ParentChildRelationshipDTO[]>;
  findByChildIds(childIds: string[]): Promise<ParentChildRelationshipDTO[]>;
}
