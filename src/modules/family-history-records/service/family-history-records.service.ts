import { Injectable, NotFoundException } from '@nestjs/common';


import { IFamilyHistoryRecordService } from './family-history-records.service.interface';
import { FamilyHistoryRecordRepository } from '../repository/family-history-records.repository';
import { FamilyHistoryRecordResponseDto } from '../dto/response/family-history-records.dto';
import { CreateFamilyHistoryRecordDto } from '../dto/request/create-family-history-record.dto';
import { FamilyHistoryRecordMapper } from '../mapper/family-history-record.mapper';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { UpdateFamilyHistoryRecordDto } from '../dto/request/update-family-history-record.dto';

@Injectable()
export class FamilyHistoryRecordService implements IFamilyHistoryRecordService {
  constructor(private readonly recordRepository: FamilyHistoryRecordRepository) {}

  async createRecord(dto: CreateFamilyHistoryRecordDto): Promise<FamilyHistoryRecordResponseDto> {
    logger.http(`Received request to create family history record for Family ID: ${dto.familyId}`);
    const entity = FamilyHistoryRecordMapper.toEntity(dto);
    const record = await this.recordRepository.create(entity);

    logger.info(`Family History Record created successfully with ID: ${record.historicalRecordId}`);
    return FamilyHistoryRecordMapper.toResponseDto(record);
  }

  async getAllRecords(): Promise<FamilyHistoryRecordResponseDto[]> {
    logger.http(`Fetching all family history records`);
    
    const records = await this.recordRepository.findAll();
    logger.info(`Fetched ${records.length} family history records`);

    return records.map(FamilyHistoryRecordMapper.toResponseDto);
  }

  async getRecordById(id: string): Promise<FamilyHistoryRecordResponseDto> {
    logger.http(`Fetching family history record with ID: ${id}`);

    const record = await this.recordRepository.findById(id);
    if (!record) {
      logger.warn(`Family History Record with ID: ${id} not found`);
      throw new NotFoundException(`Family History Record with id ${id} not found`);
    }

    logger.info(`Family History Record found with ID: ${id}`);
    return FamilyHistoryRecordMapper.toResponseDto(record);
  }

  async getRecordsByFamilyId(familyId: string): Promise<FamilyHistoryRecordResponseDto[]> {
    logger.http(`Fetching history records for Family ID: ${familyId}, sorted by start date`);

    const records = await this.recordRepository.findByFamilyId(familyId);
    logger.info(`Fetched ${records.length} sorted history records for Family ID: ${familyId}`);

    return records.map(FamilyHistoryRecordMapper.toResponseDto);
  }

  async updateRecord(id: string, dto: UpdateFamilyHistoryRecordDto): Promise<FamilyHistoryRecordResponseDto> {
    logger.http(`Received request to update family history record with ID: ${id}`);

    const updateEntity = FamilyHistoryRecordMapper.toUpdateEntity(dto);
    const updatedRecord = await this.recordRepository.update(id, updateEntity);

    if (!updatedRecord) {
      logger.warn(`Family History Record with ID: ${id} not found for update`);
      throw new NotFoundException(`Family History Record with id ${id} not found`);
    }

    logger.info(`Family History Record updated successfully with ID: ${id}`);
    return FamilyHistoryRecordMapper.toResponseDto(updatedRecord);
  }

  async deleteRecord(id: string): Promise<FamilyHistoryRecordResponseDto> {
    logger.http(`Received request to delete family history record with ID: ${id}`);

    const deletedRecord = await this.recordRepository.delete(id);
    if (!deletedRecord) {
      logger.error(`Family History Record with ID: ${id} not found for deletion`);
      throw new NotFoundException(`Family History Record with id ${id} not found`);
    }

    logger.info(`Family History Record deleted successfully with ID: ${id}`);
    return FamilyHistoryRecordMapper.toResponseDto(deletedRecord);
  }
}
