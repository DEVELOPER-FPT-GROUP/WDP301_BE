import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { FamilyHistoryRecordsService } from '../service/family-history-records.service';
import { CreateFamilyHistoryRecordDto } from '../dto/request/create-family-history-record.dto';
import { UpdateFamilyHistoryRecordDto } from '../dto/request/update-family-history-record.dto';


@Controller('family-history-records')
export class FamilyHistoryRecordsController {
  constructor(private readonly familyHistoryRecordsService: FamilyHistoryRecordsService) {}

  @Post()
  create(@Body() createFamilyHistoryRecordDto: CreateFamilyHistoryRecordDto) {
    return this.familyHistoryRecordsService.create(createFamilyHistoryRecordDto);
  }

  @Get()
  findAll() {
    return this.familyHistoryRecordsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.familyHistoryRecordsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFamilyHistoryRecordDto: UpdateFamilyHistoryRecordDto) {
    return this.familyHistoryRecordsService.update(id, updateFamilyHistoryRecordDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.familyHistoryRecordsService.delete(id);
  }
}
