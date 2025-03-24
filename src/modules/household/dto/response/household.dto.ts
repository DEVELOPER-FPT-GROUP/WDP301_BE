export class HouseholdResponseDto {
  householdId: string;
  parentHouseholdId?: string;
  headAccountId?: string;
  branchId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}
