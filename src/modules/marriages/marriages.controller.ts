import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MarriagesService } from './marriages.service';
import { CreateMarriageDto } from './dto/create-marriage.dto';
import { UpdateMarriageDto } from './dto/update-marriage.dto';

@Controller('marriages')
export class MarriagesController {
  constructor(private readonly marriagesService: MarriagesService) {}

  @Post()
  create(@Body() createMarriageDto: CreateMarriageDto) {
    return this.marriagesService.create(createMarriageDto);
  }

  @Get()
  findAll() {
    return this.marriagesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.marriagesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMarriageDto: UpdateMarriageDto) {
    return this.marriagesService.update(+id, updateMarriageDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.marriagesService.remove(+id);
  }
}
