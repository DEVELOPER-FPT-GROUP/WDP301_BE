import { Injectable } from '@nestjs/common';
import { CreateFamilyHistoryRecordDto } from './dto/create-family-history-record.dto';
import { UpdateFamilyHistoryRecordDto } from './dto/update-family-history-record.dto';

@Injectable()
export class FamilyHistoryRecordsService {
  create(createFamilyHistoryRecordDto: CreateFamilyHistoryRecordDto) {
    return 'This action adds a new familyHistoryRecord';
  }

  findAll() {
    return `This action returns all familyHistoryRecords`;
  }

  findOne(id: number) {
    return `This action returns a #${id} familyHistoryRecord`;
  }

  update(id: number, updateFamilyHistoryRecordDto: UpdateFamilyHistoryRecordDto) {
    return `This action updates a #${id} familyHistoryRecord`;
  }

  remove(id: number) {
    return `This action removes a #${id} familyHistoryRecord`;
  }
}
