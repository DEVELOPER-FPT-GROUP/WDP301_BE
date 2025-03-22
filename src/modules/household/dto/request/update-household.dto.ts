import { IsOptional, IsMongoId, IsString } from 'class-validator';

export class UpdateHouseholdDto {
  @IsOptional()
  @IsMongoId()
  parentHouseholdId?: string;

  @IsOptional()
  @IsMongoId()
  headAccountId?: string;

  @IsOptional()
  @IsMongoId()
  branchId?: string;

  @IsOptional()
  @IsString()
  name?: string;
}
