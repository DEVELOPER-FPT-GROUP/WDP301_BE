import { Controller, Get, Post, Body, Param, Delete, Inject, Put } from '@nestjs/common';
import { FamiliesService } from '../service/families.service';
import { CreateFamilyDto } from '../dto/request/create-family.dto';
import { FamilyResponse } from '../dto/response/family.dto';

@Controller('families')
export class FamiliesController {
  constructor(
    private readonly familiesService: FamiliesService,
  ) {}

  @Post()
  async createFamily(@Body() createFamilyDto: CreateFamilyDto): Promise<FamilyResponse> {
    console.log(createFamilyDto);
    return this.familiesService.createFamily(createFamilyDto);
  }

  @Get(':id')
  async getFamily(@Param('id') id: string): Promise<FamilyResponse> {
    return this.familiesService.getFamilyById(id);
  }

  @Put(':id')
  async updateFamily(
    @Param('id') id: string,
    @Body() updateData: Partial<CreateFamilyDto>,
  ): Promise<FamilyResponse> {
    return this.familiesService.updateFamily(id, updateData);
  }

  @Delete(':id')
  async deleteFamily(@Param('id') id: string): Promise<{ success: boolean }> {
    const success = await this.familiesService.deleteFamily(id);
    return { success };
  }
}
