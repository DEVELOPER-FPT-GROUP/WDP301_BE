import { Test, TestingModule } from '@nestjs/testing';
import { ParrentChildRelationshipsService } from '../parrent-child-relationships.service';

describe('ParrentChildRelationshipsService', () => {
  let service: ParrentChildRelationshipsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParrentChildRelationshipsService],
    }).compile();

    service = module.get<ParrentChildRelationshipsService>(ParrentChildRelationshipsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
