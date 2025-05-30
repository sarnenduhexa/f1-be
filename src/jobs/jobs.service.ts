import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SeasonsService } from '../seasons/seasons.service';
import { RacesService } from '../races/races.service';

@Injectable()
export class JobsService {
  private readonly logger = new Logger(JobsService.name);

  constructor(
    private readonly seasonsService: SeasonsService,
    private readonly racesService: RacesService,
  ) {}

  // For local testing, you can change it to run every minute using:
  // @Cron(CronExpression.EVERY_MINUTE)
  // Run every Sunday at 1 am (0 1 * * 0)
  @Cron('0 1 * * 0')
  async syncSeasons() {
    try {
      this.logger.log('Seasons sync: Starting');

      await this.seasonsService.syncSeasons();

      this.logger.log('Seasons sync: Completed successfully');
    } catch (error) {
      this.logger.error(
        `Error syncing seasons: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
  // For local testing, you can change it to run every minute using:
  // @Cron(CronExpression.EVERY_MINUTE)
  // Run every Sunday at 3 am (0 3 * * 0)
  @Cron('0 3 * * 0')
  async syncCurrentSeasonRaces() {
    try {
      this.logger.log('Current season races sync: Starting');

      // Get current season
      const currentYear = new Date().getFullYear();
      await this.racesService.syncRaces(currentYear);

      this.logger.log('Current season races sync: Completed successfully');
    } catch (error) {
      this.logger.error(
        `Error syncing current season races: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }
}
