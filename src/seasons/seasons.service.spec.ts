import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { SeasonsService } from './seasons.service';
import { Season } from './entities/season.entity';
import { Driver } from '../drivers/entities/driver.entity';
import axios, { AxiosError } from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('SeasonsService', () => {
  let service: SeasonsService;
  let seasonRepository: Repository<Season>;
  let driverRepository: Repository<Driver>;

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
    seasonRepository = module.get<Repository<Season>>(getRepositoryToken(Season));
    driverRepository = module.get<Repository<Driver>>(getRepositoryToken(Driver));
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
        order: { year: "ASC" },
        relations: ['winner']
      });
    });

    it('should fetch missing winner data for seasons without winner data', async () => {
      mockSeasonRepository.find
        .mockResolvedValueOnce([mockSeason, mockSeasonWithoutWinner])
        .mockResolvedValueOnce([mockSeason, mockSeason]);

      mockedAxios.get.mockResolvedValueOnce({
        data: {
          MRData: {
            StandingsTable: {
              StandingsLists: [{
                DriverStandings: [{
                  Driver: mockDriverApiResponse,
                }],
              }],
            },
          },
        },
      });

      mockDriverRepository.save.mockResolvedValue(mockDriver);

      const result = await service.findAll();
      expect(result).toEqual([mockSeason, mockSeason]);
      expect(mockSeasonRepository.update).toHaveBeenCalledWith(
        { year: mockSeasonWithoutWinner.year },
        { winnerDriverId: mockDriver.driverId }
      );
    });

    it('should handle API errors when fetching missing winner data', async () => {
      mockSeasonRepository.find
        .mockResolvedValueOnce([mockSeason, mockSeasonWithoutWinner])
        .mockResolvedValueOnce([mockSeason, mockSeasonWithoutWinner]);

      mockedAxios.get.mockRejectedValueOnce(new AxiosError('Rate limit exceeded'));

      const result = await service.findAll();
      expect(result).toEqual([mockSeason, mockSeasonWithoutWinner]);
      expect(mockSeasonRepository.update).not.toHaveBeenCalled();
    });

    it('should use existing winner driver data if available', async () => {
      mockSeasonRepository.find.mockResolvedValue([]);
      mockSeasonRepository.findOne.mockResolvedValue(mockSeason);
      
      mockedAxios.get.mockResolvedValueOnce({
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
      expect(mockSeasonRepository.findOne).toHaveBeenCalledWith({
        where: { year: mockSeasonApiResponse.season },
        relations: ['winner'],
      });
      expect(mockedAxios.get).toHaveBeenCalledTimes(1); // Only the seasons API call
    });

    it('should fetch and store seasons with winner driver if none exist in repository', async () => {
      mockSeasonRepository.find.mockResolvedValue([]);
      mockSeasonRepository.findOne.mockResolvedValue(null);
      
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            MRData: {
              SeasonTable: {
                Seasons: [mockSeasonApiResponse],
              },
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            MRData: {
              StandingsTable: {
                StandingsLists: [{
                  DriverStandings: [{
                    Driver: mockDriverApiResponse,
                  }],
                }],
              },
            },
          },
        });

      mockDriverRepository.save.mockResolvedValue(mockDriver);

      const result = await service.findAll();
      expect(result).toEqual([mockSeason]);
      expect(mockDriverRepository.save).toHaveBeenCalledWith({
        driverId: mockDriverApiResponse.driverId,
        permanentNumber: mockDriverApiResponse.permanentNumber,
        code: mockDriverApiResponse.code,
        url: mockDriverApiResponse.url,
        givenName: mockDriverApiResponse.givenName,
        familyName: mockDriverApiResponse.familyName,
        dateOfBirth: new Date(mockDriverApiResponse.dateOfBirth),
        nationality: mockDriverApiResponse.nationality,
      });
      expect(mockSeasonRepository.save).toHaveBeenCalledWith([mockSeason]);
    });

    it('should handle seasons without winner driver data', async () => {
      mockSeasonRepository.find.mockResolvedValue([]);
      mockSeasonRepository.findOne.mockResolvedValue(null);
      
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            MRData: {
              SeasonTable: {
                Seasons: [mockSeasonApiResponse],
              },
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            MRData: {
              StandingsTable: {
                StandingsLists: [],
              },
            },
          },
        });

      const result = await service.findAll();
      expect(result).toEqual([{
        year: mockSeasonApiResponse.season,
        url: mockSeasonApiResponse.url,
        winnerDriverId: undefined,
        winner: undefined,
      }]);
      expect(mockDriverRepository.save).not.toHaveBeenCalled();
      expect(mockSeasonRepository.save).toHaveBeenCalledWith([{
        year: mockSeasonApiResponse.season,
        url: mockSeasonApiResponse.url,
        winnerDriverId: undefined,
        winner: undefined,
      }]);
    });
  });

  describe('findOne', () => {
    it('should return a season if it exists in repository', async () => {
      mockSeasonRepository.findOne.mockResolvedValue(mockSeason);
      const result = await service.findOne(2023);
      expect(result).toEqual(mockSeason);
      expect(mockSeasonRepository.findOne).toHaveBeenCalledWith({ 
        where: { year: 2023 },
        relations: ['winner']
      });
    });

    it('should fetch and store season with winner driver if not in repository', async () => {
      mockSeasonRepository.findOne.mockResolvedValue(null);
      mockSeasonRepository.findOne.mockResolvedValue(null);
      
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            MRData: {
              SeasonTable: {
                Seasons: [mockSeasonApiResponse],
              },
            },
          },
        })
        .mockResolvedValueOnce({
          data: {
            MRData: {
              StandingsTable: {
                StandingsLists: [{
                  DriverStandings: [{
                    Driver: mockDriverApiResponse,
                  }],
                }],
              },
            },
          },
        });

      mockDriverRepository.save.mockResolvedValue(mockDriver);

      const result = await service.findOne(2023);
      expect(result).toEqual(mockSeason);
      expect(mockDriverRepository.save).toHaveBeenCalledWith({
        driverId: mockDriverApiResponse.driverId,
        permanentNumber: mockDriverApiResponse.permanentNumber,
        code: mockDriverApiResponse.code,
        url: mockDriverApiResponse.url,
        givenName: mockDriverApiResponse.givenName,
        familyName: mockDriverApiResponse.familyName,
        dateOfBirth: new Date(mockDriverApiResponse.dateOfBirth),
        nationality: mockDriverApiResponse.nationality,
      });
      expect(mockSeasonRepository.save).toHaveBeenCalledWith([mockSeason]);
    });

    it('should throw NotFoundException if season is not found', async () => {
      mockSeasonRepository.findOne.mockResolvedValue(null);
      mockedAxios.get.mockResolvedValue({
        data: {
          MRData: {
            SeasonTable: {
              Seasons: [],
            },
          },
        },
      });

      await expect(service.findOne(2023)).rejects.toThrow('Season 2023 not found');
    });
  });
});
