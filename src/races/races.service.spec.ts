import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { RacesService } from './races.service';
import { Race } from './entities/race.entity';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RacesService', () => {
  let service: RacesService;
  let repository: Repository<Race>;

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
    findOne: jest.fn(),
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
    repository = module.get<Repository<Race>>(getRepositoryToken(Race));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return races from repository if they exist', async () => {
      mockRepository.find.mockResolvedValue([mockRace]);
      const result = await service.findAll();
      expect(result).toEqual([mockRace]);
      expect(mockRepository.find).toHaveBeenCalled();
    });

    it('should fetch and store races if none exist in repository', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockedAxios.get.mockResolvedValue({
        data: {
          MRData: {
            RaceTable: {
              Races: [{
                season: '2023',
                round: '1',
                raceName: 'Bahrain Grand Prix',
                Circuit: {
                  circuitName: 'Bahrain International Circuit',
                },
                date: '2023-03-05',
                time: '15:00:00Z',
                url: 'https://api.jolpi.ca/ergast/f1/2023/1',
              }],
            },
          },
        },
      });

      const result = await service.findAll();
      expect(result).toEqual([mockRace]);
      expect(mockRepository.save).toHaveBeenCalledWith([mockRace]);
    });
  });

  describe('findBySeason', () => {
    it('should return races for a season if they exist in repository', async () => {
      mockRepository.find.mockResolvedValue([mockRace]);
      const result = await service.findBySeason(2023);
      expect(result).toEqual([mockRace]);
      expect(mockRepository.find).toHaveBeenCalledWith({ where: { season: 2023 } });
    });

    it('should fetch and store races if none exist for the season in repository', async () => {
      mockRepository.find.mockResolvedValue([]);
      mockedAxios.get.mockResolvedValue({
        data: {
          MRData: {
            RaceTable: {
              Races: [{
                season: '2023',
                round: '1',
                raceName: 'Bahrain Grand Prix',
                Circuit: {
                  circuitName: 'Bahrain International Circuit',
                },
                date: '2023-03-05',
                time: '15:00:00Z',
                url: 'https://api.jolpi.ca/ergast/f1/2023/1',
              }],
            },
          },
        },
      });

      const result = await service.findBySeason(2023);
      expect(result).toEqual([mockRace]);
      expect(mockRepository.save).toHaveBeenCalledWith([mockRace]);
    });
  });

  describe('findOne', () => {
    it('should return a race if it exists in repository', async () => {
      mockRepository.findOne.mockResolvedValue(mockRace);
      const result = await service.findOne(2023, 1);
      expect(result).toEqual(mockRace);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { season: 2023, round: 1 },
      });
    });

    it('should fetch and store races if the requested race is not in repository', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({
        data: {
          MRData: {
            RaceTable: {
              Races: [{
                season: '2023',
                round: '1',
                raceName: 'Bahrain Grand Prix',
                Circuit: {
                  circuitName: 'Bahrain International Circuit',
                },
                date: '2023-03-05',
                time: '15:00:00Z',
                url: 'https://api.jolpi.ca/ergast/f1/2023/1',
              }],
            },
          },
        },
      });

      const result = await service.findOne(2023, 1);
      expect(result).toEqual(mockRace);
      expect(mockRepository.save).toHaveBeenCalledWith([mockRace]);
    });
  });
});
