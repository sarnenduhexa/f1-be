import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RacesService } from './races.service';
import { RaceDto } from './dto/race.dto';

@ApiTags('races')
@Controller('races')
export class RacesController {
  constructor(private readonly racesService: RacesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all F1 races' })
  @ApiResponse({ status: 200, description: 'Returns all F1 races', type: [RaceDto] })
  async findAll(): Promise<RaceDto[]> {
    return this.racesService.findAll();
  }

  @Get('season/:season')
  @ApiOperation({ summary: 'Get all races for a specific season' })
  @ApiResponse({ status: 200, description: 'Returns all races for the specified season', type: [RaceDto] })
  async findBySeason(@Param('season', ParseIntPipe) season: number): Promise<RaceDto[]> {
    return this.racesService.findBySeason(season);
  }

  @Get('season/:season/round/:round')
  @ApiOperation({ summary: 'Get a specific race by season and round' })
  @ApiResponse({ status: 200, description: 'Returns the race for the specified season and round', type: RaceDto })
  @ApiResponse({ status: 404, description: 'Race not found' })
  async findOne(
    @Param('season', ParseIntPipe) season: number,
    @Param('round', ParseIntPipe) round: number,
  ): Promise<RaceDto> {
    return this.racesService.findOne(season, round);
  }
}
