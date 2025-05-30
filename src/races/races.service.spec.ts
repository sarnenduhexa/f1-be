import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { RacesService } from './races.service';
import { Race } from './entities/race.entity';
import { DriversService } from '../drivers/drivers.service';
import axios from 'axios';
import {
  ErgastResponse,
  RaceWithWinner,
} from './interfaces/ergast-response.interface';

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
    get: () => 'https://api.jolpi.ca/ergast',
  };

  beforeEach(() => {
    jest.resetAllMocks();
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
        winnerConstructorId: 'red_bull',
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
              },
            ],
          },
        },
      };

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockRacesResponse })
        .mockResolvedValueOnce({ data: mockWinnerResponse });

      mockRepository.find.mockResolvedValueOnce([]);

      mockDriversService.findOrCreate.mockResolvedValue(mockDriver);
      mockRepository.save.mockResolvedValue([mockRace]);

      mockRepository.find.mockResolvedValueOnce([mockRace]);

      const result = await service.findBySeason(2023);

      expect(result).toEqual([mockRace]);
      expect(mockRepository.save).toHaveBeenCalledWith([
        {
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
        },
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

      mockedAxios.get
        .mockResolvedValueOnce({ data: mockRacesResponse })
        .mockRejectedValueOnce(new Error('API Error'));

      mockRepository.find.mockResolvedValueOnce([]);
      mockRepository.save.mockResolvedValue([mockRaceWithoutWinner]);
      mockRepository.find.mockResolvedValueOnce([mockRaceWithoutWinner]);

      const result = await service.findBySeason(2023);
      expect(result).toEqual([mockRaceWithoutWinner]);
      expect(mockRepository.save).toHaveBeenCalledWith([
        {
          id: '2023-1',
          season: 2023,
          round: 1,
          raceName: 'Bahrain Grand Prix',
          circuitName: 'Bahrain International Circuit',
          date: new Date('2023-03-05'),
          time: '15:00:00Z',
          url: 'https://api.jolpi.ca/ergast/f1/2023/1',
        },
      ]);
    });
  });

  describe('syncRaces', () => {
    it('should fetch and store races for a given season', async () => {
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
              },
            ],
          },
        },
      };

      mockRepository.find.mockResolvedValue([]);
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockRacesResponse })
        .mockResolvedValueOnce({ data: mockWinnerResponse });

      mockDriversService.findOrCreate.mockResolvedValue(mockDriver);

      await service.syncRaces(2023);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.jolpi.ca/ergast/f1/2023/races',
      );
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.jolpi.ca/ergast/f1/2023/1/results.json?limit=1',
      );
      expect(mockRepository.save).toHaveBeenCalledWith([
        {
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
        },
      ]);
    });

    it('should handle errors during race synchronization', async () => {
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      await expect(service.syncRaces(2023)).rejects.toThrow('API Error');
    });
  });

  describe('processAndStoreRaces', () => {
    it('should process and store new races with correct ordering', async () => {
      const newRaces: RaceWithWinner[] = [
        {
          season: '2023',
          round: '2',
          raceName: 'Saudi Arabian Grand Prix',
          Circuit: {
            circuitId: 'jeddah',
            circuitName: 'Jeddah Corniche Circuit',
            url: 'http://en.wikipedia.org/wiki/Jeddah_Corniche_Circuit',
            Location: {
              lat: '21.5433',
              long: '39.1728',
              locality: 'Jeddah',
              country: 'Saudi Arabia',
            },
          },
          date: '2023-03-19',
          time: '17:00:00Z',
          url: 'https://api.jolpi.ca/ergast/f1/2023/2',
          winnerData: {
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
        },
      ];

      mockRepository.find.mockResolvedValue([
        {
          ...mockRace,
          round: 1,
        },
        {
          ...mockRace,
          round: 2,
        },
      ]);

      await service['processAndStoreRaces'](newRaces, 2023);

      expect(mockRepository.save).toHaveBeenCalledWith([
        {
          id: '2023-2',
          season: 2023,
          round: 2,
          raceName: 'Saudi Arabian Grand Prix',
          circuitName: 'Jeddah Corniche Circuit',
          date: new Date('2023-03-19'),
          time: '17:00:00Z',
          url: 'https://api.jolpi.ca/ergast/f1/2023/2',
          winnerDriverId: mockDriver.driverId,
          winnerConstructorId: 'red_bull',
          winnerTime: '1:33:56.736',
          winnerLaps: 57,
          winnerGrid: 1,
          winnerPoints: 25,
        },
      ]);

      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { season: 2023 },
        order: { round: 'ASC' },
        relations: ['winnerDriver'],
      });
    });

    it('should handle empty new races array', async () => {
      mockRepository.find.mockResolvedValue([mockRace]);

      await service['processAndStoreRaces']([], 2023);

      expect(mockRepository.save).not.toHaveBeenCalled();
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { season: 2023 },
        order: { round: 'ASC' },
        relations: ['winnerDriver'],
      });
    });
  });

  describe('fetchAndStoreRacesBySeason', () => {
    it('should fetch and store races with winner data', async () => {
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
              {
                season: '2023',
                round: '2',
                raceName: 'Saudi Arabian Grand Prix',
                Circuit: {
                  circuitId: 'jeddah',
                  circuitName: 'Jeddah Corniche Circuit',
                  url: 'http://en.wikipedia.org/wiki/Jeddah_Corniche_Circuit',
                  Location: {
                    lat: '21.5433',
                    long: '39.1728',
                    locality: 'Jeddah',
                    country: 'Saudi Arabia',
                  },
                },
                date: '2023-03-19',
                time: '17:00:00Z',
                url: 'https://api.jolpi.ca/ergast/f1/2023/2',
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
                season: '2023',
                round: '2',
                raceName: 'Saudi Arabian Grand Prix',
                Circuit: {
                  circuitId: 'jeddah',
                  circuitName: 'Jeddah Corniche Circuit',
                  url: 'http://en.wikipedia.org/wiki/Jeddah_Corniche_Circuit',
                  Location: {
                    lat: '21.5433',
                    long: '39.1728',
                    locality: 'Jeddah',
                    country: 'Saudi Arabia',
                  },
                },
                date: '2023-03-19',
                time: '17:00:00Z',
                url: 'https://api.jolpi.ca/ergast/f1/2023/2',
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
              },
            ],
          },
        },
      };

      // Mock existing races in database
      const existingRaces = [
        {
          ...mockRace,
          round: 1,
        },
      ];

      mockRepository.find.mockResolvedValue(existingRaces);
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockRacesResponse })
        .mockResolvedValueOnce({ data: mockWinnerResponse });
      mockDriversService.findOrCreate.mockResolvedValue(mockDriver);

      await service['fetchAndStoreRacesBySeason'](2023);

      // Verify that only the new race (round 2) is processed
      expect(mockRepository.save).toHaveBeenCalledWith([
        {
          id: '2023-2',
          season: 2023,
          round: 2,
          raceName: 'Saudi Arabian Grand Prix',
          circuitName: 'Jeddah Corniche Circuit',
          date: new Date('2023-03-19'),
          time: '17:00:00Z',
          url: 'https://api.jolpi.ca/ergast/f1/2023/2',
          winnerDriverId: mockDriver.driverId,
          winnerConstructorId: 'red_bull',
          winnerTime: '1:33:56.736',
          winnerLaps: 57,
          winnerGrid: 1,
          winnerPoints: 25,
        },
      ]);
    });

    it('should handle errors when fetching winner data', async () => {
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

      mockRepository.find.mockResolvedValue([]);
      mockedAxios.get
        .mockResolvedValueOnce({ data: mockRacesResponse })
        .mockRejectedValueOnce(new Error('API Error'));

      await service['fetchAndStoreRacesBySeason'](2023);

      // Verify that the race is still saved without winner data
      expect(mockRepository.save).toHaveBeenCalledWith([
        {
          id: '2023-1',
          season: 2023,
          round: 1,
          raceName: 'Bahrain Grand Prix',
          circuitName: 'Bahrain International Circuit',
          date: new Date('2023-03-05'),
          time: '15:00:00Z',
          url: 'https://api.jolpi.ca/ergast/f1/2023/1',
        },
      ]);
    });
  });
});
