import { MediaResponseDto } from "src/modules/media/dto/response/media-response.dto";

export class FamilyHistoryRecordResponseDto {
    historicalRecordId: string;
    familyId: string;
    historicalRecordTitle: string;
    historicalRecordSummary?: string;
    historicalRecordDetails?: string;
    startDate: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    base64Images?: MediaResponseDto[]
  }
  