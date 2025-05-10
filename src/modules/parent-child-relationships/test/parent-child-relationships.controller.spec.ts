import { Test, TestingModule } from '@nestjs/testing';
import { ParentChildRelationshipsController } from '../controller/parent-child-relationships.controller';
import { ParrentChildRelationshipsService } from '../service/parent-child-relationships.service';

describe('ParrentChildRelationshipsController', () => {
  let controller: ParentChildRelationshipsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParentChildRelationshipsController],
      providers: [ParrentChildRelationshipsService],
    }).compile();

    controller = module.get<ParentChildRelationshipsController>(ParentChildRelationshipsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
