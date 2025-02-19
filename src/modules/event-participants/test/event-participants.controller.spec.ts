import { Test, TestingModule } from '@nestjs/testing';
import { EventParticipantsController } from '../controller/event-participants.controller';
import { EventParticipantsService } from '../service/event-participants.service';


describe('EventParticipantsController', () => {
  let controller: EventParticipantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventParticipantsController],
      providers: [EventParticipantsService],
    }).compile();

    controller = module.get<EventParticipantsController>(EventParticipantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
