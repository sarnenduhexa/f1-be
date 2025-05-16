import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { SeasonsService } from './seasons.service';
import { Season } from './entities/season.entity';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SeasonsService', () => {
  let service: SeasonsService;
  let repository: Repository<Season>;

  const mockSeasonApiResponse = {
    season: 2023,
    url: 'https://api.jolpi.ca/ergast/f1/2023',
  };
  const mockSeason: Partial<Season> = {
    year: 2023,
    url: 'https://api.jolpi.ca/ergast/f1/2023',
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://api.jolpi.ca/ergast'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonsService,
        {
          provide: getRepositoryToken(Season),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<SeasonsService>(SeasonsService);
    repository = module.get<Repository<Season>>(getRepositoryToken(Season));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return seasons from repository if they exist', async () => {
      mockRepository.find.mockResolvedValue([mockSeason]);
      const result = await service.findAll();
      expect(result).toEqual([mockSeason]);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should fetch and store seasons if none exist in repository', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockedAxios.get.mockResolvedValue({
        data: {
          MRData: {
            SeasonTable: {
              Seasons: [mockSeasonApiResponse],
            },
          },
        },
      });

      const result = await service.findAll();
      expect(result).toEqual([mockSeason]);
      expect(mockRepository.save).toHaveBeenCalledWith([mockSeason]);
    });
  });

  describe('findOne', () => {
    it('should return a season if it exists in repository', async () => {
      mockRepository.findOne.mockResolvedValue(mockSeason);
      const result = await service.findOne(2023);
      expect(result).toEqual(mockSeason);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { year: 2023 } });
    });

    it('should fetch and store seasons if the requested season is not in repository', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({
        data: {
          MRData: {
            SeasonTable: {
              Seasons: [mockSeasonApiResponse],
            },
          },
        },
      });

      const result = await service.findOne(2023);
      expect(result).toEqual(mockSeason);
      expect(mockRepository.save).toHaveBeenCalledWith([mockSeason]);
    });
  });
});
