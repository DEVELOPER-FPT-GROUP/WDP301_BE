import { Test, TestingModule } from '@nestjs/testing';
import { MarriagesService } from '../marriages.service';

describe('MarriagesService', () => {
  let service: MarriagesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MarriagesService],
    }).compile();

    service = module.get<MarriagesService>(MarriagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
