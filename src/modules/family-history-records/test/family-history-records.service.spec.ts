import { Test, TestingModule } from '@nestjs/testing';
import { FamilyHistoryRecordsService } from '../family-history-records.service';

describe('FamilyHistoryRecordsService', () => {
  let service: FamilyHistoryRecordsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FamilyHistoryRecordsService],
    }).compile();

    service = module.get<FamilyHistoryRecordsService>(FamilyHistoryRecordsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
