import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { FamiliesService } from '../service/families.service';
import { CreateFamilyDto } from '../dto/request/create-family.dto';
import { FamilyDTO } from '../dto/response/family.dto';
import { ResponseDTO } from '../../../utils/response.dto';
import { UpdateFamilyDto } from '../dto/request/update-family.dto';

@Controller('families')
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  @Post()
  async createFamily(@Body() createFamilyDto: CreateFamilyDto): Promise<ResponseDTO<FamilyDTO>> {
    const result = await this.familiesService.createFamily(createFamilyDto);
    return ResponseDTO.success(result, 'Family created successfully');
  }

  @Get(':id')
  async getFamily(@Param('id') id: string): Promise<ResponseDTO<FamilyDTO>> {
    const result = await this.familiesService.getFamilyById(id);
    return ResponseDTO.success(result, 'Family retrieved successfully');
  }

  @Put(':id')
  async updateFamily(
    @Param('id') id: string,
    @Body() updateData: Partial<UpdateFamilyDto>,
  ): Promise<ResponseDTO<FamilyDTO>> {
    const result = await this.familiesService.updateFamily(id, updateData);
    return ResponseDTO.success(result, 'Family updated successfully');
  }

  @Delete(':id')
  async deleteFamily(@Param('id') id: string): Promise<ResponseDTO<boolean>> {
    const result = await this.familiesService.deleteFamily(id);
    return ResponseDTO.success(result, 'Family deleted successfully');
  }
}
