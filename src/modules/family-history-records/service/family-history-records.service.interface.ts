import { MulterFile } from "src/common/types/multer-file.type";
import { CreateFamilyHistoryRecordDto } from "../dto/request/create-family-history-record.dto";
import { UpdateFamilyHistoryRecordDto } from "../dto/request/update-family-history-record.dto";
import { FamilyHistoryRecordResponseDto } from "../dto/response/family-history-records.dto";
import { SearchFamilyHistoryRecordDto } from "../dto/request/search-family-history-record.dto";
import { PaginationDTO } from "src/utils/pagination.dto";

export interface IFamilyHistoryRecordService {
  createRecord(dto: CreateFamilyHistoryRecordDto, files: MulterFile[]): Promise<FamilyHistoryRecordResponseDto>;

  getRecordById(id: string): Promise<FamilyHistoryRecordResponseDto>;

  getRecordsByFamilyId(familyId: string): Promise<FamilyHistoryRecordResponseDto[]>;

  updateRecord(id: string, dto: UpdateFamilyHistoryRecordDto, files: MulterFile[]): Promise<FamilyHistoryRecordResponseDto>;

  deleteRecord(id: string): Promise<FamilyHistoryRecordResponseDto>;
  searchRecordsByFamilyId(
    familyId: string,
    searchDto: SearchFamilyHistoryRecordDto
  ): Promise<PaginationDTO<FamilyHistoryRecordResponseDto>>
  
}
