import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DriversService } from './drivers.service';
import { Driver } from './entities/driver.entity';

describe('DriversService', () => {
  let service: DriversService;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriversService,
        {
          provide: getRepositoryToken(Driver),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<DriversService>(DriversService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findOrCreate', () => {
    const mockDriverData = {
      driverId: 'test-driver',
      permanentNumber: '44',
      code: 'HAM',
      url: 'https://example.com',
      givenName: 'Lewis',
      familyName: 'Hamilton',
      dateOfBirth: '1985-01-07',
      nationality: 'British',
    };

    it('should find existing driver', async () => {
      const existingDriver = new Driver();
      existingDriver.driverId = mockDriverData.driverId;
      mockRepository.findOne.mockResolvedValue(existingDriver);

      const result = await service.findOrCreate(mockDriverData);

      expect(result).toBe(existingDriver);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { driverId: mockDriverData.driverId },
      });
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should create new driver when not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      const newDriver = new Driver();
      Object.assign(newDriver, {
        ...mockDriverData,
        dateOfBirth: new Date(mockDriverData.dateOfBirth),
      });
      mockRepository.save.mockResolvedValue(newDriver);

      const result = await service.findOrCreate(mockDriverData);

      expect(result).toEqual(newDriver);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { driverId: mockDriverData.driverId },
      });
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should handle partial driver data', async () => {
      const partialDriverData = {
        driverId: 'test-driver',
        givenName: 'Lewis',
      };
      mockRepository.findOne.mockResolvedValue(null);
      const newDriver = new Driver();
      newDriver.driverId = partialDriverData.driverId;
      newDriver.givenName = partialDriverData.givenName;
      mockRepository.save.mockResolvedValue(newDriver);

      const result = await service.findOrCreate(partialDriverData);

      expect(result).toEqual(newDriver);
      expect(mockRepository.save).toHaveBeenCalled();
    });

    it('should handle repository errors', async () => {
      const error = new Error('Database error');
      mockRepository.findOne.mockRejectedValue(error);

      await expect(service.findOrCreate(mockDriverData)).rejects.toThrow(error);
    });
  });
});
