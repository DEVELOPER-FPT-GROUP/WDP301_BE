import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';


import { IFamilyHistoryRecordService } from './family-history-records.service.interface';
import { FamilyHistoryRecordRepository } from '../repository/family-history-records.repository';
import { FamilyHistoryRecordResponseDto } from '../dto/response/family-history-records.dto';
import { CreateFamilyHistoryRecordDto } from '../dto/request/create-family-history-record.dto';
import { FamilyHistoryRecordMapper } from '../mapper/family-history-record.mapper';
import { winstonLogger as logger } from 'src/common/winston-logger';
import { UpdateFamilyHistoryRecordDto } from '../dto/request/update-family-history-record.dto';
import { MediaService } from 'src/modules/media/serivce/media.service';

@Injectable()
export class FamilyHistoryRecordService implements IFamilyHistoryRecordService {
  constructor(private readonly recordRepository: FamilyHistoryRecordRepository,
    private readonly mediaService: MediaService,
  ) {}

   /**
   * 📌 Create a new family history record and upload multiple images
   */
   async createRecord(
    dto: CreateFamilyHistoryRecordDto,
    files?: Express.Multer.File[], //  multiple files
  ): Promise<FamilyHistoryRecordResponseDto> {
    logger.http(`Received request to create family history record for Family ID: ${dto.familyId}`);

    try {
      let imageUrls: string[] = [];

      // If files are uploaded, upload each file to Cloudinary
      if (files && files.length > 0) {
        const uploadPromises = files.map((file) =>
          this.mediaService.uploadMedia(file, {
            ownerId: dto.familyId,
            ownerType: 'FamilyHistory',
            url: '',
            fileName: file.originalname,
            mimeType: file.mimetype,
            size: file.size
          }).then((uploaded) => uploaded.url),
        );

        imageUrls = await Promise.all(uploadPromises);
      }

      const entity = FamilyHistoryRecordMapper.toEntity(dto);

      const record = await this.recordRepository.create(entity);

      logger.info(`✅ Family History Record created successfully with ID: ${record.historicalRecordId}`);
      return FamilyHistoryRecordMapper.toResponseDto(record);
    } catch (error) {
      logger.error(`Error creating family history record: ${error.message}`);
      throw new BadRequestException('Failed to create family history record');
    }
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
