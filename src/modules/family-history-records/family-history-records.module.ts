import { Module } from '@nestjs/common';
import { FamilyHistoryRecordsController } from './controller/family-history-records.controller';
import { FamilyHistoryRecordsService } from './service/family-history-records.service';


@Module({
  controllers: [FamilyHistoryRecordsController],
  providers: [FamilyHistoryRecordsService],
})
export class FamilyHistoryRecordsModule {}
