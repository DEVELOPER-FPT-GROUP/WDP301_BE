import { Test, TestingModule } from '@nestjs/testing';
import { FamilyHistoryRecordService } from '../service/family-history-records.service';


describe('FamilyHistoryRecordsService', () => {
  let service: FamilyHistoryRecordService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FamilyHistoryRecordService],
    }).compile();

    service = module.get<FamilyHistoryRecordService>(FamilyHistoryRecordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
