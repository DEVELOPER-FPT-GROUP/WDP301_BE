import { Module } from '@nestjs/common';
import { FamilyHistoryRecordsService } from './family-history-records.service';
import { FamilyHistoryRecordsController } from './family-history-records.controller';

@Module({
  controllers: [FamilyHistoryRecordsController],
  providers: [FamilyHistoryRecordsService],
})
export class FamilyHistoryRecordsModule {}
