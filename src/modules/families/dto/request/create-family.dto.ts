import { IsOptional, IsString } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  familyName: string;

  @IsOptional()
  @IsString()
  adminAccountId?: string;
}
