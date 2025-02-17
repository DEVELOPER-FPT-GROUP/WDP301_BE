import { Test, TestingModule } from '@nestjs/testing';
import { MarriagesController } from '../controller/marriages.controller';
import { MarriagesService } from '../service/marriages.service';

describe('MarriagesController', () => {
  let controller: MarriagesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarriagesController],
      providers: [MarriagesService],
    }).compile();

    controller = module.get<MarriagesController>(MarriagesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
