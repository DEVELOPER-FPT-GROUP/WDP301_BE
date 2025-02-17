import { RelationshipTypeDTO } from '../dto/response/relationship-type.dto';
import { CreateRelationshipTypeDto } from '../dto/request/create-relationship-type.dto';

export interface IRelationshipTypesService {
  createRelationshipType(dto: CreateRelationshipTypeDto): Promise<RelationshipTypeDTO>;
  findAllRelationshipTypes(): Promise<RelationshipTypeDTO[]>;
  getRelationshipTypeById(id: string): Promise<RelationshipTypeDTO>;
  deleteRelationshipType(id: string): Promise<boolean>;
}
