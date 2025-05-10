import { IsNotEmpty, IsOptional, IsString, IsMongoId, IsInt, Min } from 'class-validator';

export class CreateBranchDto {
  @IsNotEmpty()
  @IsMongoId()
  familyId: string;

  @IsOptional()
  @IsMongoId()
  parentBranchId?: string;

  @IsOptional()
  @IsMongoId()
  headAccountId?: string;

  @IsNotEmpty()
  @IsString()
  branchName: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  branchLevel?: number;
}
