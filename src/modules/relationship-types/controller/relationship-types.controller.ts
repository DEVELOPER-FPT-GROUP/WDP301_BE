import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { RelationshipTypesService } from '../service/relationship-types.service';
import { CreateRelationshipTypeDto } from '../dto/request/create-relationship-type.dto';
import { RelationshipTypeDTO } from '../dto/response/relationship-type.dto';
import { ResponseDTO } from '../../../utils/response.dto';

@Controller('relationship-types')
export class RelationshipTypesController {
  constructor(private readonly relationshipTypesService: RelationshipTypesService) {}

  @Post()
  async create(@Body() createDto: CreateRelationshipTypeDto): Promise<ResponseDTO<RelationshipTypeDTO>> {
    const result = await this.relationshipTypesService.createRelationshipType(createDto);
    return ResponseDTO.success(result, 'Relationship type created successfully');
  }

  @Get()
  async findAll(): Promise<ResponseDTO<RelationshipTypeDTO[]>> {
    const result = await this.relationshipTypesService.findAllRelationshipTypes();
    return ResponseDTO.success(result, 'All relationship types retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ResponseDTO<RelationshipTypeDTO>> {
    const result = await this.relationshipTypesService.getRelationshipTypeById(id);
    return ResponseDTO.success(result, 'Relationship type retrieved successfully');
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ResponseDTO<boolean>> {
    await this.relationshipTypesService.deleteRelationshipType(id);
    return ResponseDTO.success(true, 'Relationship type deleted successfully');
  }
}
