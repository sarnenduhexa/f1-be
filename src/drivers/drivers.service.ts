import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from './entities/driver.entity';

interface DriverData {
  driverId: string;
  permanentNumber?: string;
  code?: string;
  url?: string;
  givenName?: string;
  familyName?: string;
  dateOfBirth?: string;
  nationality?: string;
}

@Injectable()
export class DriversService {
  private readonly logger = new Logger(DriversService.name);

  constructor(
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
  ) {}

  async findOrCreate(driverData: DriverData): Promise<Driver> {
    try {
      let driver = await this.driversRepository.findOne({
        where: { driverId: driverData.driverId },
      });

      if (!driver) {
        const newDriver = new Driver();
        newDriver.driverId = driverData.driverId;
        if (driverData.permanentNumber)
          newDriver.permanentNumber = driverData.permanentNumber;
        if (driverData.code) newDriver.code = driverData.code;
        if (driverData.url) newDriver.url = driverData.url;
        if (driverData.givenName) newDriver.givenName = driverData.givenName;
        if (driverData.familyName) newDriver.familyName = driverData.familyName;
        if (driverData.dateOfBirth)
          newDriver.dateOfBirth = new Date(driverData.dateOfBirth);
        if (driverData.nationality)
          newDriver.nationality = driverData.nationality;

        driver = await this.driversRepository.save(newDriver);
      }

      return driver;
    } catch (error) {
      this.logger.error(
        `Error in findOrCreate driver: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
}
