import { Test, TestingModule } from '@nestjs/testing';
import { RacesController } from './races.controller';
import { RacesService } from './races.service';
import { CacheModule } from '@nestjs/cache-manager';

describe('RacesController', () => {
  let controller: RacesController;

  const mockRacesService = {
    findBySeason: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [CacheModule.register()],
      controllers: [RacesController],
      providers: [{ provide: RacesService, useValue: mockRacesService }],
    }).compile();

    controller = module.get<RacesController>(RacesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
