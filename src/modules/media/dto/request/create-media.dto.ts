import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateMediaDto {
  // @IsMongoId()
  // @IsNotEmpty()
  @IsOptional()
  ownerId: string;

  // @IsEnum(['Event', 'Member'])
  // @IsNotEmpty()
  @IsOptional()
  ownerType: 'Event' | 'Member' | 'FamilyHistory' | 'Family';

  // @IsUrl()
  // @IsNotEmpty()
  @IsOptional()
  url: string;

  // @IsString()
  // @IsNotEmpty()
  @IsOptional()
  fileName: string;

  // @IsOptional()
  // @IsString()
  @IsOptional()
  caption?: string;

  // @IsString()
  // @IsNotEmpty()
  @IsOptional()
  mimeType: string;

  // @IsNumber()
  // @IsNotEmpty()
  @IsOptional()
  size: number;
  
  @IsOptional()
  base64: string;
}
