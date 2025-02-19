import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FamilyHistoryRecord, FamilyHistoryRecordSchema } from './schema/family-history-record.schema';
import { FamilyHistoryRecordController } from './controller/family-history-records.controller';
import { FamilyHistoryRecordService } from './service/family-history-records.service';
import { FamilyHistoryRecordRepository } from './repository/family-history-records.repository';
import { MediaModule } from '../media/media.module'; // ✅ Import MediaModule

@Module({
  imports: [
    MongooseModule.forFeature([{ name: FamilyHistoryRecord.name, schema: FamilyHistoryRecordSchema }]),
    MediaModule, // ✅ Đảm bảo MediaModule được import
  ],
  controllers: [FamilyHistoryRecordController], 
  providers: [FamilyHistoryRecordService, FamilyHistoryRecordRepository],
  exports: [FamilyHistoryRecordService, FamilyHistoryRecordRepository], 
})
export class FamilyHistoryRecordModule {}
