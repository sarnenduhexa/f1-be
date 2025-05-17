import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { SeasonsService } from './seasons.service';
import { Season } from './entities/season.entity';
import { Driver } from '../drivers/entities/driver.entity';
import axios from 'axios';

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
    year: 2022,
    url: 'https://api.jolpi.ca/ergast/f1/2022',
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
                    },
                  ],
                },
              ],
            },
          },
        },
      });

      mockDriverRepository.findOne.mockResolvedValue(null);
      mockDriverRepository.create.mockReturnValue(mockDriver);
      mockDriverRepository.save.mockResolvedValue(mockDriver);

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
    });

    it('should fetch and store seasons with winner data if none exist in repository', async () => {
      // First call to find returns empty array
      mockSeasonRepository.find.mockResolvedValueOnce([]);

      // Mock the API response for fetching seasons
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          MRData: {
            SeasonTable: {
              Seasons: [mockSeasonApiResponse],
            },
          },
        },
      });

      // Mock the API response for fetching winner data
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          MRData: {
            StandingsTable: {
              StandingsLists: [
                {
                  DriverStandings: [
                    {
                      Driver: mockDriverApiResponse,
                    },
                  ],
                },
              ],
            },
          },
        },
      });

      // Mock the repository responses for the subsequent calls
      mockSeasonRepository.find
        .mockResolvedValueOnce([mockSeasonWithoutWinner])
        .mockResolvedValueOnce([mockSeason]);

      mockDriverRepository.findOne.mockResolvedValue(null);
      mockDriverRepository.create.mockReturnValue(mockDriver);
      mockDriverRepository.save.mockResolvedValue(mockDriver);

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
    });
  });
});
