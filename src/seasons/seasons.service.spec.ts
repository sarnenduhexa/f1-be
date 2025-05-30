import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SeasonsService } from './seasons.service';
import { Season } from './entities/season.entity';
import { Driver } from '../drivers/entities/driver.entity';
import axios from 'axios';
import { DriversService } from '../drivers/drivers.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SeasonsService', () => {
  let service: SeasonsService;

  const mockSeasonApiResponse = {
    season: 2023,
    url: 'https://api.jolpi.ca/ergast/f1/2023',
  };

  const mockDriverApiResponse = {
    driverId: 'max_verstappen',
    permanentNumber: '33',
    code: 'VER',
    url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
    givenName: 'Max',
    familyName: 'Verstappen',
    dateOfBirth: '1997-09-30',
    nationality: 'Dutch',
  };

  const mockDriver: Partial<Driver> = {
    driverId: 'max_verstappen',
    permanentNumber: '33',
    code: 'VER',
    url: 'http://en.wikipedia.org/wiki/Max_Verstappen',
    givenName: 'Max',
    familyName: 'Verstappen',
    dateOfBirth: new Date('1997-09-30'),
    nationality: 'Dutch',
  };

  const mockSeason: Partial<Season> = {
    year: 2023,
    url: 'https://api.jolpi.ca/ergast/f1/2023',
    winnerDriverId: 'max_verstappen',
    winner: mockDriver as Driver,
  };

  const mockSeasonWithoutWinner: Partial<Season> = {
    year: 2023,
    url: 'https://api.jolpi.ca/ergast/f1/2023',
    winnerDriverId: undefined,
    winner: undefined,
  };

  const mockSeasonRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockDriverRepository = {
    save: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('https://api.jolpi.ca/ergast'),
  };

  const mockDriversService = {
    findOrCreate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeasonsService,
        {
          provide: getRepositoryToken(Season),
          useValue: mockSeasonRepository,
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: mockDriverRepository,
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

    service = module.get<SeasonsService>(SeasonsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return seasons from repository if they exist and all have winner data', async () => {
      mockSeasonRepository.find.mockResolvedValue([mockSeason]);
      const result = await service.findAll();
      expect(result).toEqual([mockSeason]);
      expect(mockSeasonRepository.find).toHaveBeenCalledWith({
        order: { year: 'ASC' },
        relations: ['winner'],
      });
    });

    it('should fetch missing winner data for seasons without winner data', async () => {
      mockSeasonRepository.find
        .mockResolvedValueOnce([mockSeason, mockSeasonWithoutWinner])
        .mockResolvedValueOnce([
          mockSeason,
          {
            ...mockSeasonWithoutWinner,
            winnerDriverId: mockDriver.driverId,
            winner: mockDriver,
          },
        ]);

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          MRData: {
            StandingsTable: {
              StandingsLists: [
                {
                  DriverStandings: [
                    {
                      Driver: mockDriverApiResponse,
                      points: '454',
                      wins: '19',
                    },
                  ],
                },
              ],
            },
          },
        },
      });

      mockDriversService.findOrCreate.mockResolvedValue(mockDriver);

      const result = await service.findAll();
      expect(result).toEqual([
        mockSeason,
        {
          ...mockSeasonWithoutWinner,
          winnerDriverId: mockDriver.driverId,
          winner: mockDriver,
        },
      ]);
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        { year: mockSeasonWithoutWinner.year },
        { winnerDriverId: mockDriver.driverId },
      );
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        1,
        'https://api.jolpi.ca/ergast/f1/2023/driverStandings/1',
      );
    });

    it('should fetch and store seasons with winner data if none exist in repository', async () => {
      mockSeasonRepository.find.mockResolvedValueOnce([]);

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          MRData: {
            SeasonTable: {
              Seasons: [mockSeasonApiResponse],
            },
          },
        },
      });

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          MRData: {
            StandingsTable: {
              StandingsLists: [
                {
                  DriverStandings: [
                    {
                      Driver: mockDriverApiResponse,
                      points: '454',
                      wins: '19',
                    },
                  ],
                },
              ],
            },
          },
        },
      });

      mockSeasonRepository.find
        .mockResolvedValueOnce([mockSeasonWithoutWinner])
        .mockResolvedValueOnce([mockSeason]);

      mockDriversService.findOrCreate.mockResolvedValue(mockDriver);

      const result = await service.findAll();

      const { season, ...mockSeasonApiResponseWithoutSeason } =
        mockSeasonApiResponse;
      const expectedSeason = {
        ...mockSeasonApiResponseWithoutSeason,
        year: season,
        winnerDriverId: mockDriver.driverId,
        winner: mockDriver,
      };
      expect(result).toEqual([expectedSeason]);
      expect(mockSeasonRepository.save).toHaveBeenCalledWith([
        {
          year: season,
          url: mockSeasonApiResponse.url,
        },
      ]);
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        { year: season },
        { winnerDriverId: mockDriver.driverId },
      );
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        1,
        'https://api.jolpi.ca/ergast/f1/seasons',
        {
          params: {
            offset: 55,
          },
        },
      );
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        2,
        'https://api.jolpi.ca/ergast/f1/2023/driverStandings/1',
      );
    });

    it('should handle errors when fetching winner data', async () => {
      mockSeasonRepository.find.mockResolvedValue([mockSeasonWithoutWinner]);
      mockedAxios.get.mockRejectedValue(new Error('API Error'));

      const result = await service.findAll();
      expect(result).toEqual([mockSeasonWithoutWinner]);
      expect(mockSeasonRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return season from repository if it exists with winner data', async () => {
      mockSeasonRepository.findOne.mockResolvedValue(mockSeason);

      const result = await service.findOne(2023);

      expect(result).toEqual(mockSeason);
      expect(mockSeasonRepository.findOne).toHaveBeenCalledWith({
        where: { year: 2023 },
        relations: ['winner'],
      });
    });

    it('should fetch season from API if not found in repository', async () => {
      mockSeasonRepository.findOne.mockResolvedValueOnce(null);

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          MRData: {
            SeasonTable: {
              Seasons: [mockSeasonApiResponse],
            },
          },
        },
      });

      mockSeasonRepository.find.mockResolvedValueOnce([
        mockSeasonWithoutWinner,
      ]);

      const result = await service.findOne(2023);

      expect(result).toEqual(mockSeason);
      expect(mockSeasonRepository.findOne).toHaveBeenCalledWith({
        where: { year: 2023 },
        relations: ['winner'],
      });
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        1,
        'https://api.jolpi.ca/ergast/f1/seasons',
        {
          params: {
            offset: 55,
          },
        },
      );
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        2,
        'https://api.jolpi.ca/ergast/f1/2023/driverStandings/1',
      );
    });

    it('should fetch winner data if season exists but has no winner', async () => {
      mockSeasonRepository.findOne
        .mockResolvedValueOnce(mockSeasonWithoutWinner)
        .mockResolvedValueOnce(mockSeason);

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          MRData: {
            StandingsTable: {
              StandingsLists: [
                {
                  DriverStandings: [
                    {
                      Driver: mockDriverApiResponse,
                      points: '454',
                      wins: '19',
                    },
                  ],
                },
              ],
            },
          },
        },
      });

      mockDriversService.findOrCreate.mockResolvedValue(mockDriver);

      const result = await service.findOne(2023);

      expect(result).toEqual(mockSeason);
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        { year: 2023 },
        { winnerDriverId: mockDriver.driverId },
      );
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        1,
        'https://api.jolpi.ca/ergast/f1/2023/driverStandings/1',
      );
    });

    it('should throw NotFoundException if season not found in API', async () => {
      mockSeasonRepository.findOne.mockResolvedValueOnce(null);

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          MRData: {
            SeasonTable: {
              Seasons: [],
            },
          },
        },
      });

      mockSeasonRepository.find.mockResolvedValue([]);

      await expect(service.findOne(2023)).rejects.toThrow(
        'Season 2023 not found',
      );
    });

    it('should throw NotFoundException if season not found after fetching winner data', async () => {
      mockSeasonRepository.findOne
        .mockResolvedValueOnce(mockSeasonWithoutWinner)
        .mockResolvedValueOnce(null);

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          MRData: {
            StandingsTable: {
              StandingsLists: [
                {
                  DriverStandings: [
                    {
                      Driver: mockDriverApiResponse,
                      points: '454',
                      wins: '19',
                    },
                  ],
                },
              ],
            },
          },
        },
      });

      mockDriversService.findOrCreate.mockResolvedValue(mockDriver);

      await expect(service.findOne(2022)).rejects.toThrow(
        'Season 2022 not found',
      );
    });

    it('should handle API errors gracefully', async () => {
      mockSeasonRepository.findOne.mockResolvedValueOnce(null);
      mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));

      await expect(service.findOne(2023)).rejects.toThrow(
        'Failed to fetch season 2023',
      );
    });
  });

  describe('syncSeasons', () => {
    const mockApiSeasonsResponse = {
      data: {
        MRData: {
          SeasonTable: {
            Seasons: [
              { season: '2023', url: 'https://api.jolpi.ca/ergast/f1/2023' },
              { season: '2024', url: 'https://api.jolpi.ca/ergast/f1/2024' },
            ],
          },
        },
      },
    };

    it('should not save any seasons when no new seasons are available', async () => {
      // Mock existing seasons in DB
      mockSeasonRepository.find.mockResolvedValueOnce([
        { year: 2023, url: 'https://api.jolpi.ca/ergast/f1/2023' },
        { year: 2024, url: 'https://api.jolpi.ca/ergast/f1/2024' },
      ]);

      // Mock API response
      mockedAxios.get.mockResolvedValueOnce(mockApiSeasonsResponse);

      // Mock final seasons list
      mockSeasonRepository.find.mockResolvedValueOnce([
        { year: 2023, url: 'https://api.jolpi.ca/ergast/f1/2023' },
        { year: 2024, url: 'https://api.jolpi.ca/ergast/f1/2024' },
      ]);

      await service.syncSeasons();

      expect(mockSeasonRepository.save).not.toHaveBeenCalled();
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.jolpi.ca/ergast/f1/seasons',
        { params: { offset: 55 } },
      );
    });

    it('should save new seasons when they are available', async () => {
      // Mock existing seasons in DB
      mockSeasonRepository.find.mockResolvedValueOnce([
        { year: 2023, url: 'https://api.jolpi.ca/ergast/f1/2023' },
      ]);

      // Mock API response with new season
      mockedAxios.get.mockResolvedValueOnce(mockApiSeasonsResponse);

      // Mock final seasons list
      mockSeasonRepository.find.mockResolvedValueOnce([
        { year: 2023, url: 'https://api.jolpi.ca/ergast/f1/2023' },
        { year: 2024, url: 'https://api.jolpi.ca/ergast/f1/2024' },
      ]);

      await service.syncSeasons();

      expect(mockSeasonRepository.save).toHaveBeenCalledWith([
        { year: '2024', url: 'https://api.jolpi.ca/ergast/f1/2024' },
      ]);
    });

    it('should fetch winner data for seasons without winners', async () => {
      // Mock existing seasons in DB
      mockSeasonRepository.find.mockResolvedValueOnce([
        {
          year: 2023,
          url: 'https://api.jolpi.ca/ergast/f1/2023',
          winnerDriverId: null,
        },
      ]);

      // Mock API response
      mockedAxios.get.mockResolvedValueOnce(mockApiSeasonsResponse);

      // Mock final seasons list
      mockSeasonRepository.find.mockResolvedValueOnce([
        {
          year: 2023,
          url: 'https://api.jolpi.ca/ergast/f1/2023',
          winnerDriverId: null,
        },
      ]);

      // Mock winner API response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          MRData: {
            StandingsTable: {
              StandingsLists: [
                {
                  DriverStandings: [
                    {
                      Driver: mockDriverApiResponse,
                      points: '454',
                      wins: '19',
                    },
                  ],
                },
              ],
            },
          },
        },
      });

      mockDriversService.findOrCreate.mockResolvedValue(mockDriver);

      await service.syncSeasons();

      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        { year: 2023 },
        { winnerDriverId: mockDriver.driverId },
      );
    });

    it('should handle both new seasons and seasons without winners', async () => {
      // Mock existing seasons in DB
      mockSeasonRepository.find.mockResolvedValueOnce([
        {
          year: 2023,
          url: 'https://api.jolpi.ca/ergast/f1/2023',
          winnerDriverId: null,
        },
      ]);

      // Mock API response with new season
      mockedAxios.get.mockResolvedValueOnce(mockApiSeasonsResponse);

      // Mock final seasons list
      mockSeasonRepository.find.mockResolvedValueOnce([
        {
          year: 2023,
          url: 'https://api.jolpi.ca/ergast/f1/2023',
          winnerDriverId: null,
        },
        { year: 2024, url: 'https://api.jolpi.ca/ergast/f1/2024' },
      ]);

      // Mock winner API response
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          MRData: {
            StandingsTable: {
              StandingsLists: [
                {
                  DriverStandings: [
                    {
                      Driver: mockDriverApiResponse,
                      points: '454',
                      wins: '19',
                    },
                  ],
                },
              ],
            },
          },
        },
      });

      mockDriversService.findOrCreate.mockResolvedValue(mockDriver);

      await service.syncSeasons();

      expect(mockSeasonRepository.save).toHaveBeenCalledWith([
        { year: '2024', url: 'https://api.jolpi.ca/ergast/f1/2024' },
      ]);
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        { year: 2023 },
        { winnerDriverId: mockDriver.driverId },
      );
    });
  });
});
