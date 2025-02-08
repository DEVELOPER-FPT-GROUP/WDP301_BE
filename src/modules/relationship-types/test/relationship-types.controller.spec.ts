import { Test, TestingModule } from '@nestjs/testing';
import { RelationshipTypesController } from '../relationship-types.controller';
import { RelationshipTypesService } from '../relationship-types.service';

describe('RelationshipTypesController', () => {
  let controller: RelationshipTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RelationshipTypesController],
      providers: [RelationshipTypesService],
    }).compile();

    controller = module.get<RelationshipTypesController>(RelationshipTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
