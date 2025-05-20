import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RacesService } from './races.service';
import { RaceDto } from './dto/race.dto';

@ApiTags('races')
@Controller('races')
export class RacesController {
  constructor(private readonly racesService: RacesService) {}

  @Get('season/:season')
  @ApiOperation({ summary: 'Get all races for a specific season' })
  @ApiResponse({
    status: 200,
    description: 'Returns all races for the specified season',
    type: [RaceDto],
  })
  async findBySeason(
    @Param('season', ParseIntPipe) season: number,
  ): Promise<RaceDto[]> {
    return this.racesService.findBySeason(season);
  }
}
