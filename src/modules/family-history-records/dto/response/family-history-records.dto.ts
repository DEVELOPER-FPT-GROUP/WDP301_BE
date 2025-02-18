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
  }
  