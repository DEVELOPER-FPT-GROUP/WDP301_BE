import { IsOptional, IsString, IsBoolean, IsEmail, IsInt, Min, IsNotEmpty } from 'class-validator';

export class SearchAccountDto {
  @IsNotEmpty()
  @IsString()
  familyId: string;

  @IsOptional()
  @IsString()
  memberId: string;

  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
