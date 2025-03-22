export class BranchResponseDto {
  branchId: string;
  familyId: string;
  parentBranchId?: string;
  headAccountId?: string;
  branchName: string;
  branchLevel: number;
  createdAt: Date;
  updatedAt: Date;
}
