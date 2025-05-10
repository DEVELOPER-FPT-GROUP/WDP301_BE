import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor
} from '@nestjs/common';
import { MarriagesService } from '../service/marriages.service';
import { CreateMarriageDto } from '../dto/request/create-marriage.dto';
import { MarriageDTO } from '../dto/response/marriage.dto';
import { ResponseDTO } from '../../../utils/response.dto';

@Controller('marriages')
@UseInterceptors(ClassSerializerInterceptor) // Enable auto-serialization
export class MarriagesController {
  constructor(private readonly marriagesService: MarriagesService) {}

  @Post()
  async create(@Body() createMarriageDto: CreateMarriageDto): Promise<ResponseDTO<MarriageDTO>> {
    const result = await this.marriagesService.createMarriage(createMarriageDto);
    return ResponseDTO.success(result, 'Marriage record created successfully');
  }

  @Get()
  async findAll(): Promise<ResponseDTO<MarriageDTO[]>> {
    const result = await this.marriagesService.findAllMarriages();
    return ResponseDTO.success(result, 'All marriage records retrieved successfully');
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ResponseDTO<MarriageDTO>> {
    const result = await this.marriagesService.getMarriageById(id);
    return ResponseDTO.success(result, 'Marriage record retrieved successfully');
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMarriageDto: Partial<CreateMarriageDto>
  ): Promise<ResponseDTO<MarriageDTO>> {
    const result = await this.marriagesService.updateMarriage(id, updateMarriageDto);
    return ResponseDTO.success(result, 'Marriage record updated successfully');
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<ResponseDTO<boolean>> {
    await this.marriagesService.deleteMarriage(id);
    return ResponseDTO.success(true, 'Marriage record deleted successfully');
  }

  @Get('/spouse/:memberId')
  async getSpouses(@Param('memberId') memberId: string): Promise<ResponseDTO<MarriageDTO>> {
    const result = await this.marriagesService.getSpouse(memberId);
    return ResponseDTO.success(result, 'Marriage record retrieved successfully');
  }
}
