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
import { MediaResponseDto } from 'src/modules/media/dto/response/media-response.dto';
import { MulterFile } from 'src/common/types/multer-file.type';

@Injectable()
export class FamilyHistoryRecordService implements IFamilyHistoryRecordService {
  constructor(
    private readonly recordRepository: FamilyHistoryRecordRepository,
    private readonly mediaService: MediaService,
  ) {}

 /**
   * 📌 Create a new family history record and upload multiple files
   */
 async createRecord(dto: CreateFamilyHistoryRecordDto, files: MulterFile[]): Promise<FamilyHistoryRecordResponseDto> {
    if (!dto) {
      throw new BadRequestException('Request body is missing or invalid');
    }

    logger.http(`Received request to create family history record for Family ID: ${dto.familyId}`);

    // Tạo bản ghi lịch sử
    const historicalRecord = FamilyHistoryRecordMapper.toEntity(dto);
    const savedRecord = await this.recordRepository.create(historicalRecord);

    // Xử lý file uploads nếu có
    let mediaList: MediaResponseDto[] = [];
    if (files && files.length > 0) {
      try {
        // Upload files to Cloudinary và lưu metadata
        mediaList = await this.mediaService.uploadMultipleFiles(
          files,
          savedRecord.historicalRecordId, 
          'FamilyHistory'
        );
        
        logger.info(`✅ Uploaded ${files.length} files for historical record ${savedRecord.historicalRecordId}`);
      } catch (error) {
        logger.error(`❌ Error uploading files for record ID ${savedRecord.historicalRecordId}: ${error.message}`);
        await this.recordRepository.delete(savedRecord.historicalRecordId);
        throw new BadRequestException(`Failed to create historical record: ${error.message}`);
      }
    } else {
      logger.info(`No files provided for historical record ${savedRecord.historicalRecordId}`);
    }

    logger.info(`✅ Family History Record created successfully with ID: ${savedRecord.historicalRecordId}`);
    return FamilyHistoryRecordMapper.toResponseDto(savedRecord, mediaList);
  }





  // async getAllRecords(): Promise<FamilyHistoryRecordResponseDto[]> {
  //   logger.http(`Fetching all family history records`);
    
  //   const records = await this.recordRepository.findAll();
  //   logger.info(`Fetched ${records.length} family history records`);

  //   return records.map(FamilyHistoryRecordMapper.toResponseDto);
  // }

  async getRecordById(id: string): Promise<FamilyHistoryRecordResponseDto> {
    logger.http(`Fetching family history record with ID: ${id}`);

    const record = await this.recordRepository.findById(id);
    if (!record) {
        logger.warn(`Family History Record with ID: ${id} not found`);
        throw new NotFoundException(`Family History Record with id ${id} not found`);
    }

    // 📌 Truy vấn tất cả media có `ownerId = id`
    const mediaList = await this.mediaService.getMediaByOwners([id], 'FamilyHistory');

    logger.info(`Family History Record found with ID: ${id} and ${mediaList.length} media files`);
    
    return FamilyHistoryRecordMapper.toResponseDto(record, mediaList);
}


  async getRecordsByFamilyId(familyId: string): Promise<FamilyHistoryRecordResponseDto[]> {
    logger.http(`Fetching history records for Family ID: ${familyId}, sorted by start date`);

    const records = await this.recordRepository.findByFamilyId(familyId);
    logger.info(`Fetched ${records.length} sorted history records for Family ID: ${familyId}`);

    if (records.length === 0) return [];

    // 📌 Lấy tất cả historicalRecordId từ danh sách records
    const recordIds = records.map(record => record.historicalRecordId);

    // 📌 Truy vấn tất cả media có `ownerId` thuộc `recordIds`
    const mediaList = await this.mediaService.getMediaByOwners(recordIds, 'FamilyHistory');

    // 📌 Gom nhóm media theo `ownerId`
    const mediaGroupedByRecord = recordIds.reduce((acc, recordId) => {
        acc[recordId] = mediaList.filter(media => media.ownerId === recordId);
        return acc;
    }, {} as Record<string, MediaResponseDto[]>);

    // 📌 Map từng record với danh sách media tương ứng
    return records.map(record => 
        FamilyHistoryRecordMapper.toResponseDto(record, mediaGroupedByRecord[record.historicalRecordId] || [])
    );
}


/**
   * 📌 Update a family history record and handle file uploads/deletions
   */
async updateRecord(id: string, dto: UpdateFamilyHistoryRecordDto, files: MulterFile[]): Promise<FamilyHistoryRecordResponseDto> {
    logger.http(`Received request to update family history record with ID: ${id}`);

    // Kiểm tra xem record có tồn tại không
    const existingRecord = await this.recordRepository.findById(id);
    if (!existingRecord) {
      logger.warn(`Family History Record with ID: ${id} not found for update`);
      throw new NotFoundException(`Family History Record with id ${id} not found`);
    }

    let mediaList: MediaResponseDto[] = [];

    // Xóa ảnh nếu có yêu cầu
    if (dto.deleteImageIds && dto.deleteImageIds.length > 0) {
      logger.info(`Deleting ${dto.deleteImageIds.length} images for Family History Record ID: ${id}`);
      
      try {
        // Xóa song song để tăng tốc độ
        await Promise.all(dto.deleteImageIds.map(imageId => this.mediaService.deleteMedia(imageId)));
        logger.info(`✅ Successfully deleted ${dto.deleteImageIds.length} images`);
      } catch (error) {
        logger.error(`❌ Failed to delete some images: ${error.message}`);
        throw new BadRequestException(`Failed to delete images: ${error.message}`);
      }
    }

    // Upload files mới nếu có
    if (dto.isChangeImage && files && files.length > 0) {
      logger.info(`Uploading ${files.length} new files for Family History Record ID: ${id}`);
      
      try {
        mediaList = await this.mediaService.uploadMultipleFiles(files, id, 'FamilyHistory');
        logger.info(`✅ Uploaded ${files.length} new files`);
      } catch (error) {
        logger.error(`❌ Failed to upload new files: ${error.message}`);
        throw new BadRequestException(`Failed to upload new files: ${error.message}`);
      }
    } else {
      // Nếu không có file mới, lấy danh sách media hiện tại
      mediaList = await this.mediaService.getMediaByOwners([id], 'FamilyHistory');
    }

    // Cập nhật thông tin record
    const updateEntity = FamilyHistoryRecordMapper.toUpdateEntity(dto);
    const updatedRecord = await this.recordRepository.update(id, updateEntity);

    if (!updatedRecord) {
      logger.warn(`Family History Record with ID: ${id} not found after update`);
      throw new NotFoundException(`Family History Record with id ${id} not found`);
    }
+
    logger.info(`✅ Family History Record updated successfully with ID: ${id}`);
    return FamilyHistoryRecordMapper.toResponseDto(updatedRecord, mediaList);
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
