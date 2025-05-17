import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Season } from './entities/season.entity';
import { SeasonDto } from './dto/season.dto';
import { Driver } from '../drivers/entities/driver.entity';
import {
  ErgastResponse,
  ErgastDriver,
} from './interfaces/ergast-response.interface';

@Injectable()
export class SeasonsService {
  private readonly logger = new Logger(SeasonsService.name);

  constructor(
    @InjectRepository(Season)
    private seasonsRepository: Repository<Season>,
    @InjectRepository(Driver)
    private driversRepository: Repository<Driver>,
    private configService: ConfigService,
  ) {}

  async findAll(): Promise<SeasonDto[]> {
    const seasons = await this.seasonsRepository.find({
      order: { year: 'ASC' },
      relations: ['winner'],
    });

    if (seasons.length === 0) {
      await this.fetchAndStoreSeasons();
      const newSeasons = await this.seasonsRepository.find({
        order: { year: 'ASC' },
      });
      await this.fetchAndStoreWinners(newSeasons);
      return this.seasonsRepository.find({
        order: { year: 'ASC' },
        relations: ['winner'],
      });
    }

    const seasonsWithoutWinner = seasons.filter(
      (season) => !season.winnerDriverId,
    );

    if (seasonsWithoutWinner.length > 0) {
      await this.fetchAndStoreWinners(seasonsWithoutWinner);
      return this.seasonsRepository.find({
        order: { year: 'ASC' },
        relations: ['winner'],
      });
    }

    return seasons;
  }

  async findOne(year: number): Promise<SeasonDto> {
    const season = await this.seasonsRepository.findOne({
      where: { year },
      relations: ['winner'],
    });

    if (!season) {
      const seasons = await this.fetchAndStoreSeasons();
      const foundSeason = seasons.find((s) => s.year === year);
      if (!foundSeason) {
        throw new NotFoundException(`Season ${year} not found`);
      }
      return foundSeason;
    }

    if (!season.winnerDriverId) {
      await this.fetchAndStoreWinners([season]);
      const updatedSeason = await this.seasonsRepository.findOne({
        where: { year },
        relations: ['winner'],
      });
      if (!updatedSeason) {
        throw new NotFoundException(`Season ${year} not found`);
      }
      return updatedSeason;
    }

    return season;
  }

  private async fetchAndStoreSeasons(): Promise<Season[]> {
    const baseUrl = this.configService.get<string>('ergastApi.baseUrl');
    const response = await axios.get<ErgastResponse>(`${baseUrl}/f1/seasons`, {
      params: {
        // This is hardcoded because our requirement is to only show data from 2005.
        offset: 55,
      },
    });
    const seasons =
      response.data.MRData.SeasonTable?.Seasons.map((season) => ({
        year: season.season,
        url: season.url,
      })) ?? [];

    await this.seasonsRepository.save(seasons);
    return this.seasonsRepository.find({
      order: { year: 'ASC' },
      relations: ['winner'],
    });
  }

  private async fetchAndStoreWinners(seasons: Season[]): Promise<void> {
    const baseUrl = this.configService.get<string>('ergastApi.baseUrl');

    for (const season of seasons) {
      try {
        const response = await axios.get<ErgastResponse>(
          `${baseUrl}/f1/${season.year}/driverStandings/1`,
        );

        const driverData =
          response.data.MRData.StandingsTable?.StandingsLists[0]
            ?.DriverStandings[0]?.Driver;

        if (driverData) {
          const driver = await this.saveDriver(driverData);
          await this.seasonsRepository.update(
            { year: season.year },
            { winnerDriverId: driver.driverId },
          );
        }
      } catch (error) {
        console.error(
          `Failed to fetch winner data for season ${season.year}:`,
          error,
        );
      }
    }
  }

  private async saveDriver(driverData: ErgastDriver): Promise<Driver> {
    const existingDriver = await this.driversRepository.findOne({
      where: { driverId: driverData.driverId },
    });

    if (existingDriver) {
      return existingDriver;
    }

    const driver = this.driversRepository.create({
      driverId: driverData.driverId,
      permanentNumber: driverData.permanentNumber,
      code: driverData.code,
      url: driverData.url,
      givenName: driverData.givenName,
      familyName: driverData.familyName,
      dateOfBirth: new Date(driverData.dateOfBirth),
      nationality: driverData.nationality,
    });

    return this.driversRepository.save(driver);
  }
}
