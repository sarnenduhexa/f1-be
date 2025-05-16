import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Season } from './entities/season.entity';
import { SeasonDto } from './dto/season.dto';

@Injectable()
export class SeasonsService {
  constructor(
    @InjectRepository(Season)
    private seasonsRepository: Repository<Season>,
    private configService: ConfigService,
  ) {}

  async findAll(): Promise<SeasonDto[]> {
    const seasons = await this.seasonsRepository.find();
    if (seasons.length === 0) {
      return this.fetchAndStoreSeasons();
    }
    return seasons;
  }

  async findOne(year: number): Promise<SeasonDto> {
    const season = await this.seasonsRepository.findOne({ where: { year } });
    if (!season) {
      const seasons = await this.fetchAndStoreSeasons();
      const foundSeason = seasons.find(s => s.year === year);
      if (!foundSeason) {
        throw new NotFoundException(`Season ${year} not found`);
      }
      return foundSeason;
    }
    return season;
  }

  private async fetchAndStoreSeasons(): Promise<SeasonDto[]> {
    const baseUrl = this.configService.get<string>('ergastApi.baseUrl');
    const response = await axios.get(`${baseUrl}/f1/seasons`);
    
    const seasons = response.data.MRData.SeasonTable.Seasons.map(season => ({
      year: parseInt(season.season),
      url: season.url,
    }));

    await this.seasonsRepository.save(seasons);
    return seasons;
  }
}
