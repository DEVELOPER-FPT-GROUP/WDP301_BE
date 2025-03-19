import { PartialType } from '@nestjs/mapped-types';
import { CreateMemberDto } from './create-member.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  isChangeImage?: boolean;

  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  deleteImageIds?: string[];
}
