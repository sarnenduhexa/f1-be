import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { RacesService } from './races.service';
import { Race } from './entities/race.entity';
import { DriversService } from '../drivers/drivers.service';
import axios from 'axios';
import { ErgastResponse } from './interfaces/ergast-response.interface';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RacesService', () => {
  let service: RacesService;

  const mockDriver = {
    driverId: 'max_verstappen',
    code: 'VER',
    url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
    givenName: 'Max',
    familyName: 'Verstappen',
    dateOfBirth: '1997-09-30',
    nationality: 'Dutch',
  };

  const mockRaceWithoutWinnerDriver = {
    id: '2023-1',
    season: 2023,
    round: 1,
    raceName: 'Bahrain Grand Prix',
    circuitName: 'Bahrain International Circuit',
    date: new Date('2023-03-05'),
    time: '15:00:00Z',
    url: 'https://api.jolpi.ca/ergast/f1/2023/1',
    winnerDriverId: mockDriver.driverId,
    winnerConstructorId: 'red_bull',
    winnerTime: '1:33:56.736',
    winnerLaps: 57,
    winnerGrid: 1,
    winnerPoints: 25,
  };

  const mockRace = {
    ...mockRaceWithoutWinnerDriver,
    winnerDriver: mockDriver,
  };

  const mockRaceWithoutWinner = {
    id: '2023-1',
    season: 2023,
    round: 1,
    raceName: 'Bahrain Grand Prix',
    circuitName: 'Bahrain International Circuit',
    date: new Date('2023-03-05'),
    time: '15:00:00Z',
    url: 'https://api.jolpi.ca/ergast/f1/2023/1',
    winnerDriverId: null,
    winnerDriver: null,
    winnerConstructorId: null,
    winnerTime: null,
    winnerLaps: null,
    winnerGrid: null,
    winnerPoints: null,
  };

  const mockRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  };

  const mockDriversService = {
    findOrCreate: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://api.jolpi.ca/ergast'),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

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
        {
          provide: DriversService,
          useValue: mockDriversService,
        },
      ],
    }).compile();

    service = module.get<RacesService>(RacesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findBySeason', () => {
    it('should return races with winner data if they exist in repository', async () => {
      mockRepository.find.mockResolvedValue([mockRace]);
      const result = await service.findBySeason(2023);
      expect(result).toEqual([mockRace]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { season: 2023 },
        order: { round: 'ASC' },
        relations: ['winnerDriver'],
      });
    });

    it('should fetch winner data for races that exist but are missing winner data', async () => {
      mockRepository.find
        .mockResolvedValueOnce([mockRaceWithoutWinner])
        .mockResolvedValueOnce([mockRace]);

      const mockWinnerResponse: ErgastResponse = {
        MRData: {
          xmlns: '',
          series: '',
          url: '',
          limit: '',
          offset: '',
          total: '',
          RaceTable: {
            season: '2023',
            Races: [
              {
                Results: [
                  {
                    Driver: mockDriver,
                    Constructor: {
                      constructorId: 'red_bull',
                      url: 'http://en.wikipedia.org/wiki/Red_Bull_Racing',
                      name: 'Red Bull',
                      nationality: 'Austrian',
                    },
                    Time: { millis: '56367636', time: '1:33:56.736' },
                    laps: '57',
                    grid: '1',
                    points: '25',
                    status: 'Finished',
                  },
                ],
                season: '2023',
                round: '1',
                url: 'https://api.jolpi.ca/ergast/f1/2023/1',
                raceName: 'Bahrain Grand Prix',
                Circuit: {
                  circuitId: 'bahrain',
                  circuitName: 'Bahrain International Circuit',
                  url: 'http://en.wikipedia.org/wiki/Bahrain_International_Circuit',
                  Location: {
                    lat: '26.0325',
                    long: '50.5106',
                    locality: 'Sakhir',
                    country: 'Bahrain',
                  },
                },
                date: '2023-03-05',
                time: '15:00:00Z',
              },
            ],
          },
        },
      };

      mockedAxios.get.mockResolvedValue({ data: mockWinnerResponse });
      mockDriversService.findOrCreate.mockResolvedValue(mockDriver);

      const result = await service.findBySeason(2023);
      expect(result).toEqual([mockRace]);
      expect(mockRepository.save).toHaveBeenCalledWith({
        ...mockRaceWithoutWinner,
        winnerDriverId: mockDriver.driverId,
        winnerDriver: mockDriver,
        winnerConstructorId: null,
        winnerTime: '1:33:56.736',
        winnerLaps: 57,
        winnerGrid: 1,
        winnerPoints: 25,
      });
    });

    it('should fetch and store races with winner data if none exist for the season', async () => {
      mockRepository.find.mockResolvedValueOnce([]);

      const mockRacesResponse: ErgastResponse = {
        MRData: {
          xmlns: '',
          series: '',
          url: '',
          limit: '',
          offset: '',
          total: '',
          RaceTable: {
            season: '2023',
            Races: [
              {
                season: '2023',
                round: '1',
                raceName: 'Bahrain Grand Prix',
                Circuit: {
                  circuitId: 'bahrain',
                  circuitName: 'Bahrain International Circuit',
                  url: 'http://en.wikipedia.org/wiki/Bahrain_International_Circuit',
                  Location: {
                    lat: '26.0325',
                    long: '50.5106',
                    locality: 'Sakhir',
                    country: 'Bahrain',
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

      const mockWinnerResponse: ErgastResponse = {
        MRData: {
          xmlns: '',
          series: '',
          url: '',
          limit: '',
          offset: '',
          total: '',
          RaceTable: {
            season: '2023',
            Races: [
              {
                Results: [
                  {
                    Driver: mockDriver,
                    Constructor: {
                      constructorId: 'red_bull',
                      url: 'http://en.wikipedia.org/wiki/Red_Bull_Racing',
                      name: 'Red Bull',
                      nationality: 'Austrian',
                    },
                    Time: { millis: '56367636', time: '1:33:56.736' },
                    laps: '57',
                    grid: '1',
                    points: '25',
                    status: 'Finished',
                  },
                ],
                season: '2023',
                round: '1',
                url: 'https://api.jolpi.ca/ergast/f1/2023/1',
                raceName: 'Bahrain Grand Prix',
                Circuit: {
                  circuitId: 'bahrain',
                  circuitName: 'Bahrain International Circuit',
                  url: 'http://en.wikipedia.org/wiki/Bahrain_International_Circuit',
                  Location: {
                    lat: '26.0325',
                    long: '50.5106',
                    locality: 'Sakhir',
                    country: 'Bahrain',
                  },
                },
                date: '2023-03-05',
                time: '15:00:00Z',
              },
            ],
          },
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockRacesResponse })
        .mockResolvedValueOnce({ data: mockWinnerResponse });

      mockDriversService.findOrCreate.mockResolvedValue(mockDriver);
      mockRepository.save.mockResolvedValue([mockRace]);
      mockRepository.find.mockResolvedValueOnce([mockRace]);

      const result = await service.findBySeason(2023);

      expect(result).toEqual([mockRace]);
      expect(mockRepository.save).toHaveBeenCalledWith([
        mockRaceWithoutWinnerDriver,
      ]);
    });

    it('should handle errors when fetching winner data', async () => {
      mockRepository.find.mockResolvedValueOnce([]);
      const mockRacesResponse: ErgastResponse = {
        MRData: {
          xmlns: '',
          series: '',
          url: '',
          limit: '',
          offset: '',
          total: '',
          RaceTable: {
            season: '2023',
            Races: [
              {
                season: '2023',
                round: '1',
                raceName: 'Bahrain Grand Prix',
                Circuit: {
                  circuitId: 'bahrain',
                  circuitName: 'Bahrain International Circuit',
                  url: 'http://en.wikipedia.org/wiki/Bahrain_International_Circuit',
                  Location: {
                    lat: '26.0325',
                    long: '50.5106',
                    locality: 'Sakhir',
                    country: 'Bahrain',
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
      const expectedRaceWithoutWinner = {
        id: '2023-1',
        season: 2023,
        round: 1,
        raceName: 'Bahrain Grand Prix',
        circuitName: 'Bahrain International Circuit',
        date: new Date('2023-03-05'),
        time: '15:00:00Z',
        url: 'https://api.jolpi.ca/ergast/f1/2023/1',
      };
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockRacesResponse })
        .mockRejectedValueOnce(new Error('API Error'));
      mockRepository.save.mockResolvedValue([mockRaceWithoutWinner]);
      mockRepository.find.mockResolvedValueOnce([mockRaceWithoutWinner]);

      const result = await service.findBySeason(2023);
      expect(result).toEqual([mockRaceWithoutWinner]);
      expect(mockRepository.save).toHaveBeenCalledWith([
        expectedRaceWithoutWinner,
      ]);
    });
  });
});
