import { Test, TestingModule } from '@nestjs/testing';
import { NotificationReceiversService } from '../notification-receivers.service';

describe('NotificationReceiversService', () => {
  let service: NotificationReceiversService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationReceiversService],
    }).compile();

    service = module.get<NotificationReceiversService>(NotificationReceiversService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
