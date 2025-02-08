import { Injectable } from '@nestjs/common';
import { CreateParrentChildRelationshipDto } from './dto/create-parrent-child-relationship.dto';
import { UpdateParrentChildRelationshipDto } from './dto/update-parrent-child-relationship.dto';

@Injectable()
export class ParrentChildRelationshipsService {
  create(createParrentChildRelationshipDto: CreateParrentChildRelationshipDto) {
    return 'This action adds a new parrentChildRelationship';
  }

  findAll() {
    return `This action returns all parrentChildRelationships`;
  }

  findOne(id: number) {
    return `This action returns a #${id} parrentChildRelationship`;
  }

  update(id: number, updateParrentChildRelationshipDto: UpdateParrentChildRelationshipDto) {
    return `This action updates a #${id} parrentChildRelationship`;
  }

  remove(id: number) {
    return `This action removes a #${id} parrentChildRelationship`;
  }
}
