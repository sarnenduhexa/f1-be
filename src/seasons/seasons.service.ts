import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError } from 'axios';
import { Season } from './entities/season.entity';
import { SeasonDto } from './dto/season.dto';
import { Driver } from '../drivers/entities/driver.entity';

interface ErgastDriver {
  driverId: string;
  permanentNumber: string;
  code: string;
  url: string;
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  nationality: string;
}

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
      order: { year: "ASC" },
      relations: ['winner']
    });

    if (seasons.length === 0) {
      return this.fetchAndStoreSeasons();
    }

    // Find seasons without winner data
    const seasonsWithoutWinner = seasons.filter(season => !season.winner);
    
    if (seasonsWithoutWinner.length > 0) {
      this.logger.debug(`Found ${seasonsWithoutWinner.length} seasons without winner data. Attempting to fetch...`);
      await this.fetchMissingWinnerData(seasonsWithoutWinner);
      
      // Fetch updated seasons with winner data
      return this.seasonsRepository.find({ 
        order: { year: "ASC" },
        relations: ['winner']
      });
    }

    return seasons;
  }

  async findOne(year: number): Promise<SeasonDto> {
    const season = await this.seasonsRepository.findOne({ 
      where: { year },
      relations: ['winner']
    });
    if (!season) {
      const seasons = await this.fetchAndStoreSeasons();
      const foundSeason = seasons.find((s) => s.year === year);
      if (!foundSeason) {
        throw new NotFoundException(`Season ${year} not found`);
      }
      return foundSeason;
    }
    return season;
  }

  private async fetchMissingWinnerData(seasons: Season[]): Promise<void> {
    const baseUrl = this.configService.get<string>('ergastApi.baseUrl');

    for (const season of seasons) {
      try {
        // Fetch winner driver details for the season
        const driverStandingsResponse = await axios.get(
          `${baseUrl}/f1/${season.year}/driverStandings/1`
        );

        if (driverStandingsResponse.data.MRData.StandingsTable.StandingsLists.length > 0) {
          const driverData: ErgastDriver = driverStandingsResponse.data.MRData.StandingsTable.StandingsLists[0].DriverStandings[0].Driver;
          
          // Create or update driver record
          const winnerDriver = await this.driversRepository.save({
            driverId: driverData.driverId,
            permanentNumber: driverData.permanentNumber,
            code: driverData.code,
            url: driverData.url,
            givenName: driverData.givenName,
            familyName: driverData.familyName,
            dateOfBirth: new Date(driverData.dateOfBirth),
            nationality: driverData.nationality,
          });

          // Update season with winner data
          await this.seasonsRepository.update(
            { year: season.year },
            { winnerDriverId: winnerDriver.driverId }
          );

          this.logger.debug(`Successfully fetched and stored winner data for season ${season.year}`);
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          this.logger.warn(`Failed to fetch winner driver data for season ${season.year}: ${error.message}`);
        } else {
          this.logger.error(`Unexpected error fetching winner driver data for season ${season.year}:`, error);
        }
      }
    }
  }

  private async fetchAndStoreSeasons(): Promise<SeasonDto[]> {
    const baseUrl = this.configService.get<string>('ergastApi.baseUrl');
    const response = await axios.get(`${baseUrl}/f1/seasons`, {
      // This is hardcoded because our requirement is to only show data from 2005.
      params: { offset: 55 }
    });

    const seasons = await Promise.all(
      response.data.MRData.SeasonTable.Seasons.map(async (season) => {
        const year = parseInt(season.season);
        
        // Check if we already have the winner driver data for this season
        const existingSeason = await this.seasonsRepository.findOne({
          where: { year },
          relations: ['winner'],
        });

        if (existingSeason?.winner) {
          this.logger.debug(`Using existing winner driver data for season ${year}`);
          return existingSeason;
        }

        try {
          // Fetch winner driver details for the season
          const driverStandingsResponse = await axios.get(
            `${baseUrl}/f1/${year}/driverStandings/1`
          );

          if (driverStandingsResponse.data.MRData.StandingsTable.StandingsLists.length > 0) {
            const driverData: ErgastDriver = driverStandingsResponse.data.MRData.StandingsTable.StandingsLists[0].DriverStandings[0].Driver;
            
            // Create or update driver record
            const winnerDriver = await this.driversRepository.save({
              driverId: driverData.driverId,
              permanentNumber: driverData.permanentNumber,
              code: driverData.code,
              url: driverData.url,
              givenName: driverData.givenName,
              familyName: driverData.familyName,
              dateOfBirth: new Date(driverData.dateOfBirth),
              nationality: driverData.nationality,
            });

            return {
              year,
              url: season.url,
              winnerDriverId: winnerDriver.driverId,
              winner: winnerDriver,
            };
          }
        } catch (error) {
          if (error instanceof AxiosError) {
            this.logger.warn(`Failed to fetch winner driver data for season ${year}: ${error.message}`);
          } else {
            this.logger.error(`Unexpected error fetching winner driver data for season ${year}:`, error);
          }
        }

        // Return season without winner data if the API call failed
        return {
          year,
          url: season.url,
          winnerDriverId: undefined,
          winner: undefined,
        };
      })
    );

    // Save all seasons, including those without winner data
    await this.seasonsRepository.save(seasons);
    return seasons;
  }
}
