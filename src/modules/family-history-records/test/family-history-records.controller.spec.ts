import { Test, TestingModule } from '@nestjs/testing';
import { FamilyHistoryRecordsController } from '../family-history-records.controller';
import { FamilyHistoryRecordsService } from '../family-history-records.service';

describe('FamilyHistoryRecordsController', () => {
  let controller: FamilyHistoryRecordsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FamilyHistoryRecordsController],
      providers: [FamilyHistoryRecordsService],
    }).compile();

    controller = module.get<FamilyHistoryRecordsController>(FamilyHistoryRecordsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
