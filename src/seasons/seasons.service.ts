import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Season } from './entities/season.entity';
import { SeasonDto } from './dto/season.dto';
import { DriversService } from '../drivers/drivers.service';
import { ErgastResponse } from './interfaces/ergast-response.interface';

@Injectable()
export class SeasonsService {
  private readonly logger = new Logger(SeasonsService.name);

  constructor(
    @InjectRepository(Season)
    private seasonsRepository: Repository<Season>,
    private driversService: DriversService,
    private configService: ConfigService,
  ) {}

  async findAll(): Promise<SeasonDto[]> {
    this.logger.debug('Finding all seasons');
    const seasons = await this.seasonsRepository.find({
      order: { year: 'ASC' },
      relations: ['winner'],
    });

    // If there are no seasons, fetch them from the API and store them in the database
    // Also fetch the winners for the seasons
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
    // If there are seasons, but no winner,
    // fetch the winner from the API and store it in the database
    if (seasonsWithoutWinner.length > 0) {
      await this.fetchAndStoreWinners(seasonsWithoutWinner);
      return this.seasonsRepository.find({
        order: { year: 'ASC' },
        relations: ['winner'],
      });
    }

    // If there are seasons and winners in the database,
    // return the seasons with the winners.
    return seasons;
  }

  async findOne(year: number): Promise<SeasonDto> {
    this.logger.debug(`Finding season ${year}`);
    try {
      // First try to find the season in the database
      let season = await this.seasonsRepository.findOne({
        where: { year },
        relations: ['winner'],
      });

      // If season doesn't exist, fetch all seasons and try again
      if (!season) {
        this.logger.debug(
          `Season ${year} not found in database, fetching from API...`,
        );
        const seasons = await this.fetchAndStoreSeasons();
        const foundSeason = seasons.find((s) => s.year === year);

        if (!foundSeason) {
          this.logger.warn(`Season ${year} not found in API response`);
          throw new NotFoundException(`Season ${year} not found`);
        }
        season = foundSeason;
      }

      // If season exists but has no winner, fetch winner data
      if (!season.winnerDriverId) {
        this.logger.debug(`Fetching winner data for season ${year}...`);
        await this.fetchAndStoreWinners([season]);
        const updatedSeason = await this.seasonsRepository.findOne({
          where: { year },
          relations: ['winner'],
        });

        if (!updatedSeason) {
          this.logger.error(
            `Failed to retrieve season ${year} after fetching winner data`,
          );
          throw new NotFoundException(`Season ${year} not found`);
        }
        season = updatedSeason;
      }

      return season;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error fetching season ${year}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw new NotFoundException(`Failed to fetch season ${year}`);
    }
  }

  async syncSeasons() {
    // First get existing seasons from DB
    const existingSeasons = await this.seasonsRepository.find({
      order: { year: 'ASC' },
      relations: ['winner'],
    });

    // Fetch seasons from API
    const baseUrl = this.configService.get<string>('ergastApi.baseUrl');
    const response = await axios.get<ErgastResponse>(`${baseUrl}/f1/seasons`, {
      params: {
        offset: 55, // Hardcoded to only show data from 2005
      },
    });

    const apiSeasons =
      response.data.MRData.SeasonTable?.Seasons.map((season) => ({
        year: season.season,
        url: season.url,
      })) ?? [];

    // Find new seasons that don't exist in DB
    const newSeasons = apiSeasons.filter(
      (apiSeason) =>
        !existingSeasons.some((dbSeason) => dbSeason.year == apiSeason.year),
    );

    // Save only new seasons if any exist
    if (newSeasons.length > 0) {
      this.logger.log(`Found ${newSeasons.length} new seasons`);
      await this.seasonsRepository.save(newSeasons);
    }

    // Get all seasons including newly added ones
    const allSeasons = await this.seasonsRepository.find({
      order: { year: 'ASC' },
      relations: ['winner'],
    });

    // Find seasons without winner data
    const seasonsWithoutWinner = allSeasons.filter(
      (season) => !season.winnerDriverId,
    );

    // Fetch winner data for seasons without winners
    if (seasonsWithoutWinner.length > 0) {
      await this.fetchAndStoreWinners(seasonsWithoutWinner);
    }
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
    this.logger.debug(
      `Fetching and storing winners for ${seasons.length} seasons`,
    );
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
          const driver = await this.driversService.findOrCreate(driverData);
          await this.seasonsRepository.update(
            { year: season.year },
            { winnerDriverId: driver.driverId },
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to fetch winner data for season ${season.year}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
      }
    }
  }
}
