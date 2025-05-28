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
import { SeasonsService } from './seasons.service';
import { SeasonDto } from './dto/season.dto';
import { CacheInterceptor } from '@nestjs/cache-manager';

@ApiTags('seasons')
@Controller('seasons')
@UseInterceptors(CacheInterceptor)
export class SeasonsController {
  constructor(private readonly seasonsService: SeasonsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all F1 seasons' })
  @ApiResponse({
    status: 200,
    description: 'Returns all F1 seasons',
    type: [SeasonDto],
  })
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: SeasonDto })
  async findAll(): Promise<SeasonDto[]> {
    return this.seasonsService.findAll();
  }

  @Get(':year')
  @ApiOperation({ summary: 'Get a specific F1 season by year' })
  @ApiResponse({
    status: 200,
    description: 'Returns the F1 season for the specified year',
    type: SeasonDto,
  })
  @ApiResponse({ status: 404, description: 'Season not found' })
  @UseInterceptors(ClassSerializerInterceptor)
  @SerializeOptions({ type: SeasonDto })
  async findOne(@Param('year', ParseIntPipe) year: number): Promise<SeasonDto> {
    return this.seasonsService.findOne(year);
  }
}
