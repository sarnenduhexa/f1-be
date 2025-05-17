import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Race } from './entities/race.entity';
import { RaceDto } from './dto/race.dto';
import {
  ErgastResponse,
  ErgastRace,
} from './interfaces/ergast-response.interface';

@Injectable()
export class RacesService {
  constructor(
    @InjectRepository(Race)
    private racesRepository: Repository<Race>,
    private configService: ConfigService,
  ) {}

  async findAll(): Promise<RaceDto[]> {
    const races = await this.racesRepository.find();
    if (races.length === 0) {
      return this.fetchAndStoreRaces();
    }
    return races;
  }

  async findBySeason(season: number): Promise<RaceDto[]> {
    const races = await this.racesRepository.find({ where: { season } });
    if (races.length === 0) {
      return this.fetchAndStoreRacesBySeason(season);
    }
    return races;
  }

  async findOne(season: number, round: number): Promise<RaceDto> {
    const race = await this.racesRepository.findOne({
      where: { season, round },
    });
    if (!race) {
      const races = await this.fetchAndStoreRacesBySeason(season);
      const foundRace = races.find((r) => r.round === round);
      if (!foundRace) {
        throw new NotFoundException(
          `Race ${round} for season ${season} not found`,
        );
      }
      return foundRace;
    }
    return race;
  }

  private async fetchAndStoreRaces(): Promise<RaceDto[]> {
    const baseUrl = this.configService.get<string>('ergastApi.baseUrl');
    const response = await axios.get<ErgastResponse>(
      `${baseUrl}/f1/current/races`,
    );
    return this.processAndStoreRaces(response.data.MRData.RaceTable.Races);
  }

  private async fetchAndStoreRacesBySeason(season: number): Promise<RaceDto[]> {
    const baseUrl = this.configService.get<string>('ergastApi.baseUrl');
    const response = await axios.get<ErgastResponse>(
      `${baseUrl}/f1/${season}/races`,
    );
    return this.processAndStoreRaces(response.data.MRData.RaceTable.Races);
  }

  private async processAndStoreRaces(races: ErgastRace[]): Promise<RaceDto[]> {
    const processedRaces = races.map((race) => ({
      id: `${race.season}-${race.round}`,
      season: parseInt(race.season, 10),
      round: parseInt(race.round, 10),
      raceName: race.raceName,
      circuitName: race.Circuit.circuitName,
      date: new Date(race.date),
      time: race.time,
      url: race.url,
    }));

    await this.racesRepository.save(processedRaces);
    return processedRaces;
  }
}
