import { Injectable } from '@nestjs/common';
import { CreateRelationshipTypeDto } from './dto/create-relationship-type.dto';
import { UpdateRelationshipTypeDto } from './dto/update-relationship-type.dto';

@Injectable()
export class RelationshipTypesService {
  create(createRelationshipTypeDto: CreateRelationshipTypeDto) {
    return 'This action adds a new relationshipType';
  }

  findAll() {
    return `This action returns all relationshipTypes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} relationshipType`;
  }

  update(id: number, updateRelationshipTypeDto: UpdateRelationshipTypeDto) {
    return `This action updates a #${id} relationshipType`;
  }

  remove(id: number) {
    return `This action removes a #${id} relationshipType`;
  }
}
