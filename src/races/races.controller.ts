import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  SerializeOptions,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { RacesService } from './races.service';
import { RaceDto } from './dto/race.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiTags('races')
@Controller('races')
@UseInterceptors(CacheInterceptor)
export class RacesController {
  constructor(private readonly racesService: RacesService) {}

  @Get('season/:season')
  @ApiOperation({ summary: 'Get all races for a specific season' })
  @ApiResponse({
    status: 200,
    description: 'Returns all races for the specified season',
    type: [RaceDto],
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: RaceDto })
  async findBySeason(
    @Param('season', ParseIntPipe) season: number,
  ): Promise<RaceDto[]> {
    return this.racesService.findBySeason(season);
  }
}
