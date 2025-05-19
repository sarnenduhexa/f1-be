import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { RacesService } from './races.service';
import { Race } from './entities/race.entity';
import axios from 'axios';
import { ErgastResponse } from './interfaces/ergast-response.interface';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RacesService', () => {
  let service: RacesService;

  const mockRace = {
    id: '2023-1',
    season: 2023,
    round: 1,
    raceName: 'Bahrain Grand Prix',
    circuitName: 'Bahrain International Circuit',
    date: new Date('2023-03-05'),
    time: '15:00:00Z',
    url: 'https://api.jolpi.ca/ergast/f1/2023/1',
  };

  const mockRepository = {
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://api.jolpi.ca/ergast'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RacesService,
        {
          provide: getRepositoryToken(Race),
          useValue: mockRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<RacesService>(RacesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findBySeason', () => {
    it('should return races for a season if they exist in repository', async () => {
      mockRepository.find.mockResolvedValue([mockRace]);
      const result = await service.findBySeason(2023);
      expect(result).toEqual([mockRace]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { season: 2023 },
      });
    });

    it('should fetch and store races if none exist for the season in repository', async () => {
      mockRepository.find.mockResolvedValue([]);
      const mockResponse: ErgastResponse = {
        MRData: {
          xmlns: '',
          series: '',
          url: '',
          limit: '',
          offset: '',
          total: '',
          RaceTable: {
            Races: [
              {
                season: '2023',
                round: '1',
                raceName: 'Bahrain Grand Prix',
                Circuit: {
                  circuitId: '',
                  circuitName: 'Bahrain International Circuit',
                  url: '',
                  Location: {
                    lat: '',
                    long: '',
                    locality: '',
                    country: '',
                  },
                },
                date: '2023-03-05',
                time: '15:00:00Z',
                url: 'https://api.jolpi.ca/ergast/f1/2023/1',
              },
            ],
          },
        },
      };
      mockedAxios.get.mockResolvedValue({ data: mockResponse });

      const result = await service.findBySeason(2023);
      expect(result).toEqual([mockRace]);
      expect(mockRepository.save).toHaveBeenCalledWith([mockRace]);
    });
  });
});
