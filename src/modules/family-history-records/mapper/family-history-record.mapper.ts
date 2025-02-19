import mongoose from 'mongoose';
import { FamilyHistoryRecord } from '../schema/family-history-record.schema';
import { CreateFamilyHistoryRecordDto } from '../dto/request/create-family-history-record.dto';
import { UpdateFamilyHistoryRecordDto } from '../dto/request/update-family-history-record.dto';
import { FamilyHistoryRecordResponseDto } from '../dto/response/family-history-records.dto';
import { MediaResponseDto } from 'src/modules/media/dto/response/media-response.dto';


export class FamilyHistoryRecordMapper {
  /**
   * Converts Create DTO to FamilyHistoryRecord Entity
   */
  static toEntity(dto: CreateFamilyHistoryRecordDto): FamilyHistoryRecord {
    return {
      historicalRecordId: `HIST-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      familyId: new mongoose.Types.ObjectId(dto.familyId), // Convert to ObjectId
      historicalRecordTitle: dto.historicalRecordTitle,
      historicalRecordSummary: dto.historicalRecordSummary || '',
      historicalRecordDetails: dto.historicalRecordDetails || '',
      startDate: dto.startDate,
      endDate: dto.endDate || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as FamilyHistoryRecord;
  }

  /**
   * Converts Update DTO to Partial Entity (for updating)
   */
  static toUpdateEntity(dto: UpdateFamilyHistoryRecordDto): Partial<FamilyHistoryRecord> {
    const updateData: Partial<FamilyHistoryRecord> = {};

    if (dto.historicalRecordTitle) updateData.historicalRecordTitle = dto.historicalRecordTitle;
    if (dto.historicalRecordSummary) updateData.historicalRecordSummary = dto.historicalRecordSummary;
    if (dto.historicalRecordDetails) updateData.historicalRecordDetails = dto.historicalRecordDetails;
    if (dto.startDate) updateData.startDate = dto.startDate;
    if (dto.endDate) updateData.endDate = dto.endDate;

    updateData.updatedAt = new Date(); // Always update the timestamp

    return updateData;
  }

  /**
   * Converts Database Entity to Response DTO
   */
  static toResponseDto(
    record: FamilyHistoryRecord,
    mediaList: MediaResponseDto[] = [] // Thêm tham số để nhận danh sách media
): FamilyHistoryRecordResponseDto {
    return {
      historicalRecordId: record.historicalRecordId,
      familyId: record.familyId.toString(), // Convert ObjectId to string
      historicalRecordTitle: record.historicalRecordTitle,
      historicalRecordSummary: record.historicalRecordSummary,
      historicalRecordDetails: record.historicalRecordDetails,
      startDate: record.startDate,
      endDate: record.endDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      base64Images: mediaList, 
    };
}

}
