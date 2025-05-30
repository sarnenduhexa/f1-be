import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Race } from './entities/race.entity';
import { DriversService } from '../drivers/drivers.service';
import {
  ErgastResponse,
  ErgastRace,
  ErgastResult,
} from './interfaces/ergast-response.interface';

interface RaceWithWinner extends ErgastRace {
  winnerData: ErgastResult | null;
}

@Injectable()
export class RacesService {
  private readonly logger = new Logger(RacesService.name);

  constructor(
    @InjectRepository(Race)
    private readonly raceRepository: Repository<Race>,
    private readonly configService: ConfigService,
    private readonly driversService: DriversService,
  ) {}

  async findBySeason(season: number): Promise<Race[]> {
    this.logger.debug(`Finding races for season ${season}`);
    const baseUrl = this.configService.get<string>('ergastApi.baseUrl');
    try {
      // First check if we have races for this season
      const existingRaces = await this.raceRepository.find({
        where: { season },
        order: { round: 'ASC' },
        relations: ['winnerDriver'],
      });

      if (existingRaces.length > 0) {
        // Check if any races are missing winner data
        const racesWithoutWinner = existingRaces.filter(
          (race) => !race.winnerDriver,
        );

        //If the racesWithoutWinner is empty, we can return the existingRaces
        if (racesWithoutWinner.length === 0) {
          return existingRaces;
        }

        if (racesWithoutWinner.length > 0) {
          this.logger.log(
            `Found ${racesWithoutWinner.length} races without winner data for season ${season}`,
          );

          // Fetch winner data for races without it
          for (const race of racesWithoutWinner) {
            try {
              const url = `${baseUrl}/f1/${season}/${race.round}/results.json?limit=1`;
              const winnerResponse = await axios.get<ErgastResponse>(url);

              const winnerData =
                winnerResponse.data.MRData.RaceTable.Races[0]?.Results?.[0];

              if (winnerData?.Driver) {
                // Ensure driver exists in database
                const driver = await this.driversService.findOrCreate({
                  driverId: winnerData.Driver.driverId,
                  code: winnerData.Driver.code,
                  url: winnerData.Driver.url,
                  givenName: winnerData.Driver.givenName,
                  familyName: winnerData.Driver.familyName,
                  dateOfBirth: winnerData.Driver.dateOfBirth,
                  nationality: winnerData.Driver.nationality,
                });

                // Update race with winner data
                race.winnerDriver = driver;
                race.winnerDriverId = driver.driverId;
                race.winnerConstructorId =
                  winnerData.Constructor?.constructorId;
                race.winnerTime = winnerData.Time?.time || '';
                race.winnerLaps = parseInt(winnerData.laps, 10);
                race.winnerGrid = parseInt(winnerData.grid, 10);
                race.winnerPoints = parseInt(winnerData.points, 10);

                await this.raceRepository.save(race);
                this.logger.log(
                  `Updated winner data for race ${race.round} in season ${season}`,
                );
              }
            } catch (error) {
              this.logger.error(
                `Error fetching winner data for race ${race.round} in season ${season}: ${error instanceof Error ? error.message : 'Unknown error'}`,
              );
            }
          }
        }

        // Return all races with updated winner data
        return this.raceRepository.find({
          where: { season },
          order: { round: 'ASC' },
          relations: ['winnerDriver'],
        });
      }

      // If no races found, fetch and store them
      return this.fetchAndStoreRacesBySeason(season);
    } catch (error) {
      this.logger.error(
        `Error finding races for season ${season}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  async syncRaces(season: number) {
    this.logger.debug(`Syncing races for season ${season}`);
    await this.fetchAndStoreRacesBySeason(season);
  }

  private async fetchAndStoreRacesBySeason(season: number): Promise<Race[]> {
    this.logger.debug(`Fetching and storing races for season ${season}`);
    const baseUrl = this.configService.get<string>('ergastApi.baseUrl');
    try {
      const response = await axios.get<ErgastResponse>(
        `${baseUrl}/f1/${season}/races`,
      );
      const races = response.data.MRData.RaceTable.Races;

      // Get all existing races for the season in a single query
      const existingRaces = await this.raceRepository.find({
        where: { season },
        relations: ['winnerDriver'],
      });

      // Create a map of existing races for quick lookup
      const existingRacesMap = new Map(
        existingRaces.map((race) => [race.id, race]),
      );

      // Fetch winner data for each race that doesn't exist or doesn't have winner data
      const racesWithWinners = await Promise.all(
        races.map(async (race) => {
          const existingRace = existingRacesMap.get(
            `${race.season}-${race.round}`,
          );

          // If race exists and has winner data, return it
          if (existingRace?.winnerDriverId) {
            return existingRace;
          }

          try {
            const winnerResponse = await axios.get<ErgastResponse>(
              `${baseUrl}/f1/${season}/${race.round}/results.json?limit=1`,
            );
            const winnerData =
              winnerResponse.data.MRData.RaceTable.Races[0]?.Results?.[0];

            // If we have winner data, ensure the driver exists in our database
            if (winnerData?.Driver) {
              this.logger.log(
                `Successfully fetched winner data for race ${race.round}`,
              );
              await this.driversService.findOrCreate(winnerData.Driver);
            }

            return {
              ...race,
              winnerData: winnerData || null,
            } as RaceWithWinner;
          } catch (error) {
            this.logger.error(
              `Error fetching winner data for race ${race.round}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            );
            return {
              ...race,
              winnerData: null,
            } as RaceWithWinner;
          }
        }),
      );

      // Filter out races that already have winner data or don't exist in the database
      const racesToProcess = racesWithWinners.filter(
        (race: RaceWithWinner) =>
          race.winnerData ||
          !existingRacesMap.get(`${race.season}-${race.round}`),
      );

      return this.processAndStoreRaces(racesToProcess, season);
    } catch (error) {
      this.logger.error(
        `Error fetching races for season ${season}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  private async processAndStoreRaces(
    races: (RaceWithWinner | Race)[],
    season: number,
  ): Promise<Race[]> {
    // Separate the new races
    const newRaces = races.filter(
      (race): race is RaceWithWinner => !(race instanceof Race),
    );

    const processedNewRaces = newRaces.map((race) => {
      const raceData: Partial<Race> = {
        id: `${race.season}-${race.round}`,
        season: parseInt(race.season, 10),
        round: parseInt(race.round, 10),
        raceName: race.raceName,
        circuitName: race.Circuit.circuitName,
        date: new Date(race.date),
        time: race.time,
        url: race.url,
      };

      if (race.winnerData) {
        raceData.winnerDriverId = race.winnerData.Driver?.driverId;
        raceData.winnerConstructorId =
          race.winnerData.Constructor?.constructorId;
        raceData.winnerTime = race.winnerData.Time?.time;
        raceData.winnerLaps = race.winnerData.laps
          ? parseInt(race.winnerData.laps, 10)
          : undefined;
        raceData.winnerGrid = race.winnerData.grid
          ? parseInt(race.winnerData.grid, 10)
          : undefined;
        raceData.winnerPoints = race.winnerData.points
          ? parseInt(race.winnerData.points, 10)
          : undefined;
      }

      return raceData;
    });

    try {
      // Only save new races
      if (processedNewRaces.length > 0) {
        await this.raceRepository.save(processedNewRaces);
      }

      // Return all races for the season with winner driver relations
      return this.raceRepository.find({
        where: { season },
        order: { round: 'ASC' },
        relations: ['winnerDriver'],
      });
    } catch (error) {
      this.logger.error(
        `Error storing races: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
}
