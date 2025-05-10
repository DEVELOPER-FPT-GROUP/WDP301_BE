import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UpdateParentChildRelationshipDto } from '../dto/request/update-parent-child-relationship.dto';
import { CreateParentChildRelationshipDto } from '../dto/request/create-parent-child-relationship.dto';
import { ParentChildRelationshipsService } from '../service/parent-child-relationships.service';

@Controller('parent-child-relationships')
export class ParentChildRelationshipsController {
  constructor(private readonly parentChildRelationshipsService: ParentChildRelationshipsService) {}

  @Post()
  create(@Body() createParentChildRelationshipDto: CreateParentChildRelationshipDto) {
    return this.parentChildRelationshipsService.createRelationship(createParentChildRelationshipDto);
  }

  @Get()
  findAll() {
    return this.parentChildRelationshipsService.findAllRelationships();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parentChildRelationshipsService.getRelationshipById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateParentChildRelationshipDto: UpdateParentChildRelationshipDto) {
    return this.parentChildRelationshipsService.updateRelationship(id, updateParentChildRelationshipDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.parentChildRelationshipsService.deleteRelationship(id);
  }
}
