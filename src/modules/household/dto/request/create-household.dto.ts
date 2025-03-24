import { IsNotEmpty, IsOptional, IsString, IsMongoId } from 'class-validator';

export class CreateHouseholdDto {
  @IsOptional()
  @IsMongoId()
  parentHouseholdId?: string;

  @IsOptional()
  @IsMongoId()
  headAccountId?: string;

  @IsNotEmpty()
  @IsMongoId()
  branchId: string;

  @IsNotEmpty()
  @IsString()
  name: string;
}
