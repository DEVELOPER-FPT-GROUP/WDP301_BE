import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { IFamilyHistoryRecordService } from './family-history-records.service.interface';
import { FamilyHistoryRecordRepository } from '../repository/family-history-records.repository';
import { FamilyHistoryRecordResponseDto } from '../dto/response/family-history-records.dto';
import { CreateFamilyHistoryRecordDto } from '../dto/request/create-family-history-record.dto';
import { FamilyHistoryRecordMapper } from '../mapper/family-history-record.mapper';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { UpdateFamilyHistoryRecordDto } from '../dto/request/update-family-history-record.dto';
import { MediaService } from 'src/modules/media/serivce/media.service';
import { CreateMediaDto } from 'src/modules/media/dto/request/create-media.dto';

@Injectable()
export class FamilyHistoryRecordService implements IFamilyHistoryRecordService {
  constructor(
    private readonly recordRepository: FamilyHistoryRecordRepository,
    private readonly mediaService: MediaService,
  ) {}

  /**
   * 📌 Create a new family history record and upload multiple images as base64
   */
  async createRecord(dto: CreateFamilyHistoryRecordDto): Promise<FamilyHistoryRecordResponseDto> {
    if (!dto) {
        throw new BadRequestException('Request body is missing or invalid');
    }

    logger.http(`Received request to create family history record for Family ID: ${dto.familyId}`);

    // Tạo bản ghi lịch sử
    const historicalRecord = FamilyHistoryRecordMapper.toEntity(dto);
    const savedRecord = await this.recordRepository.create(historicalRecord);

    // Kiểm tra nếu base64Images chỉ chứa 1 ảnh dạng string
    let base64Images: string[] = [];
    if (typeof dto.base64Images === 'string') {
        base64Images = [dto.base64Images];  // Chuyển thành mảng có 1 phần tử
    } else if (Array.isArray(dto.base64Images)) {
        base64Images = dto.base64Images;
    }

    if (base64Images.length === 0) {
        logger.warn(`No images provided for historical record ${savedRecord.historicalRecordId}`);
        return FamilyHistoryRecordMapper.toResponseDto(savedRecord);
    }

    try {
        const mediaDtoList: CreateMediaDto[] = base64Images.map((base64: string, index: number) => ({
            ownerId: savedRecord.historicalRecordId,
            ownerType: 'FamilyHistory',
            base64,
            fileName: `family_history_${Date.now()}_${index}.png`,
            mimeType: 'image/png',
            url: '',  // Initialize with empty string, will be set after upload
            size: Buffer.from(base64, 'base64').length
        }));

        await this.mediaService.uploadMultipleMedia(mediaDtoList);

    } catch (error) {
        logger.error(`Error uploading media for record ID ${savedRecord.historicalRecordId}: ${error.message}`);
        await this.recordRepository.delete(savedRecord.historicalRecordId);
        throw new BadRequestException(`Failed to create historical record: ${error.message}`);
    }

    logger.info(`✅ Family History Record created successfully with ID: ${savedRecord.historicalRecordId}`);
    return FamilyHistoryRecordMapper.toResponseDto(savedRecord);
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
