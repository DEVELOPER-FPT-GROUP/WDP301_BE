import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateMediaDto {
  @IsMongoId()
  @IsNotEmpty()
  ownerId: string;

  @IsEnum(['Event', 'Member'])
  @IsNotEmpty()
  ownerType: 'Event' | 'Member';

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @IsNumber()
  @IsNotEmpty()
  size: number;
}
