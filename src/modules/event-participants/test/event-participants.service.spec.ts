import { Test, TestingModule } from '@nestjs/testing';
import { EventParticipantsService } from '../service/event-participants.service';


describe('EventParticipantsService', () => {
  let service: EventParticipantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventParticipantsService],
    }).compile();

    service = module.get<EventParticipantsService>(EventParticipantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
