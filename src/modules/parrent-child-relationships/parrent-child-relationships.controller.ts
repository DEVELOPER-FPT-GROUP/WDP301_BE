import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ParrentChildRelationshipsService } from './parrent-child-relationships.service';
import { CreateParrentChildRelationshipDto } from './dto/create-parrent-child-relationship.dto';
import { UpdateParrentChildRelationshipDto } from './dto/update-parrent-child-relationship.dto';

@Controller('parrent-child-relationships')
export class ParrentChildRelationshipsController {
  constructor(private readonly parrentChildRelationshipsService: ParrentChildRelationshipsService) {}

  @Post()
  create(@Body() createParrentChildRelationshipDto: CreateParrentChildRelationshipDto) {
    return this.parrentChildRelationshipsService.create(createParrentChildRelationshipDto);
  }

  @Get()
  findAll() {
    return this.parrentChildRelationshipsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.parrentChildRelationshipsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateParrentChildRelationshipDto: UpdateParrentChildRelationshipDto) {
    return this.parrentChildRelationshipsService.update(+id, updateParrentChildRelationshipDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.parrentChildRelationshipsService.remove(+id);
  }
}
