import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RelationshipTypesService } from './relationship-types.service';
import { CreateRelationshipTypeDto } from './dto/create-relationship-type.dto';
import { UpdateRelationshipTypeDto } from './dto/update-relationship-type.dto';

@Controller('relationship-types')
export class RelationshipTypesController {
  constructor(private readonly relationshipTypesService: RelationshipTypesService) {}

  @Post()
  create(@Body() createRelationshipTypeDto: CreateRelationshipTypeDto) {
    return this.relationshipTypesService.create(createRelationshipTypeDto);
  }

  @Get()
  findAll() {
    return this.relationshipTypesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.relationshipTypesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRelationshipTypeDto: UpdateRelationshipTypeDto) {
    return this.relationshipTypesService.update(+id, updateRelationshipTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.relationshipTypesService.remove(+id);
  }
}
