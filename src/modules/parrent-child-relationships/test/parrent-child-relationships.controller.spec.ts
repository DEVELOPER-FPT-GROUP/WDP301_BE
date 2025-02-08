import { Test, TestingModule } from '@nestjs/testing';
import { ParrentChildRelationshipsController } from '../parrent-child-relationships.controller';
import { ParrentChildRelationshipsService } from '../parrent-child-relationships.service';

describe('ParrentChildRelationshipsController', () => {
  let controller: ParrentChildRelationshipsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParrentChildRelationshipsController],
      providers: [ParrentChildRelationshipsService],
    }).compile();

    controller = module.get<ParrentChildRelationshipsController>(ParrentChildRelationshipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
