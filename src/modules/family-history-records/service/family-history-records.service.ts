import { Injectable } from '@nestjs/common';
import { FamilyHistoryRecordsRepository } from '../repository/family-history-records.repository';
import { CreateFamilyHistoryRecordDto } from '../dto/request/create-family-history-record.dto';
import { UpdateFamilyHistoryRecordDto } from '../dto/request/update-family-history-record.dto';
import { FamilyHistoryRecord } from '../schema/family-history-record.schema';
import { IFamilyHistoryRecordsService } from './family-history-records.service.interface';

@Injectable()
export class FamilyHistoryRecordsService implements IFamilyHistoryRecordsService {
  constructor(private readonly familyHistoryRecordsRepository: FamilyHistoryRecordsRepository) {}

  async findById(id: string): Promise<FamilyHistoryRecord | null> {
    return this.familyHistoryRecordsRepository.findById(id);
  }

  async create(data: CreateFamilyHistoryRecordDto): Promise<FamilyHistoryRecord> {
    return this.familyHistoryRecordsRepository.create(data);
  }

  async update(id: string, updateData: UpdateFamilyHistoryRecordDto): Promise<FamilyHistoryRecord | null> {
    return this.familyHistoryRecordsRepository.update(id, updateData);
  }

  async delete(id: string): Promise<boolean> {
    return this.familyHistoryRecordsRepository.delete(id);
  }

  async findAll(): Promise<FamilyHistoryRecord[]> {
    return this.familyHistoryRecordsRepository.findAll();
  }
}
