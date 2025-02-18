import { CreateFamilyHistoryRecordDto } from "../dto/request/create-family-history-record.dto";
import { UpdateFamilyHistoryRecordDto } from "../dto/request/update-family-history-record.dto";
import { FamilyHistoryRecordResponseDto } from "../dto/response/family-history-records.dto";

export interface IFamilyHistoryRecordService {
  createRecord(dto: CreateFamilyHistoryRecordDto): Promise<FamilyHistoryRecordResponseDto>;

  getAllRecords(): Promise<FamilyHistoryRecordResponseDto[]>;

  getRecordById(id: string): Promise<FamilyHistoryRecordResponseDto>;

  getRecordsByFamilyId(familyId: string): Promise<FamilyHistoryRecordResponseDto[]>;

  updateRecord(id: string, dto: UpdateFamilyHistoryRecordDto): Promise<FamilyHistoryRecordResponseDto>;

  deleteRecord(id: string): Promise<FamilyHistoryRecordResponseDto>;
}
