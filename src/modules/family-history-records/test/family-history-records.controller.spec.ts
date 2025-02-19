import { Test, TestingModule } from '@nestjs/testing';
import { FamilyHistoryRecordController } from '../controller/family-history-records.controller';
import { FamilyHistoryRecordService } from '../service/family-history-records.service';


describe('FamilyHistoryRecordsController', () => {
  let controller: FamilyHistoryRecordController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FamilyHistoryRecordController],
      providers: [FamilyHistoryRecordService],
    }).compile();

    controller = module.get<FamilyHistoryRecordController>(FamilyHistoryRecordController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
