import { Test, TestingModule } from '@nestjs/testing';
import { NotificationReceiversController } from '../notification-receivers.controller';
import { NotificationReceiversService } from '../notification-receivers.service';

describe('NotificationReceiversController', () => {
  let controller: NotificationReceiversController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationReceiversController],
      providers: [NotificationReceiversService],
    }).compile();

    controller = module.get<NotificationReceiversController>(NotificationReceiversController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
