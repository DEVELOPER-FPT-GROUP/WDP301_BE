import { IsOptional, IsString, IsMongoId, IsInt, Min } from 'class-validator';

export class UpdateBranchDto {
  @IsOptional()
  @IsMongoId()
  parentBranchId?: string;

  @IsOptional()
  @IsMongoId()
  headAccountId?: string;

  @IsOptional()
  @IsString()
  branchName?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  branchLevel?: number;
}
