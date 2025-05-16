import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';

export class RaceDto {
  @ApiProperty({ description: 'Unique identifier for the race' })
  @IsString()
  id: string;

  @ApiProperty({ description: 'The season year' })
  @IsNumber()
  season: number;

  @ApiProperty({ description: 'The round number in the season' })
  @IsNumber()
  round: number;

  @ApiProperty({ description: 'Name of the race' })
  @IsString()
  raceName: string;

  @ApiProperty({ description: 'Name of the circuit' })
  @IsString()
  circuitName: string;

  @ApiProperty({ description: 'Date of the race' })
  @IsDate()
  date: Date;

  @ApiProperty({ description: 'Time of the race', required: false })
  @IsString()
  @IsOptional()
  time?: string;

  @ApiProperty({ description: 'URL to race details', required: false })
  @IsString()
  @IsOptional()
  url?: string;
} 