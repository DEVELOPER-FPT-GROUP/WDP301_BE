import { PartialType } from '@nestjs/mapped-types';
import { CreateFamilyHistoryRecordDto } from './create-family-history-record.dto';

export class UpdateFamilyHistoryRecordDto extends PartialType(CreateFamilyHistoryRecordDto) {}
