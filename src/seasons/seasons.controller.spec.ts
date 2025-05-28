import { Test, TestingModule } from '@nestjs/testing';
import { SeasonsController } from './seasons.controller';
import { SeasonsService } from './seasons.service';
import { CacheModule } from '@nestjs/cache-manager';

describe('SeasonsController', () => {
  let controller: SeasonsController;

  const mockSeasonsService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [SeasonsController],
      providers: [{ provide: SeasonsService, useValue: mockSeasonsService }],
    }).compile();

    controller = module.get<SeasonsController>(SeasonsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
