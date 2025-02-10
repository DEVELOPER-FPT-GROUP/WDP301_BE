import { PartialType } from '@nestjs/mapped-types';
import { CreateMarriageDto } from './create-marriage.dto';

export class UpdateMarriageDto extends PartialType(CreateMarriageDto) {}
