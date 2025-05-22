import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Type } from 'class-transformer';
import { IsString, IsNumber, IsDate, IsOptional } from 'class-validator';
import { DriverDto } from '../../drivers/dto/driver.dto';

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

  @ApiProperty({ description: 'ID of the winning driver', required: false })
  @IsString()
  @IsOptional()
  winnerDriverId?: string;

  @ApiProperty({
    description: 'ID of the winning constructor',
    required: false,
  })
  @IsString()
  @IsOptional()
  winnerConstructorId?: string;

  @ApiProperty({ description: 'Winning time', required: false })
  @IsString()
  @IsOptional()
  winnerTime?: string;

  @ApiProperty({
    description: 'Number of laps completed by winner',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  winnerLaps?: number;

  @ApiProperty({
    description: 'Starting grid position of winner',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  winnerGrid?: number;

  @ApiProperty({ description: 'Points earned by winner', required: false })
  @IsNumber()
  @IsOptional()
  winnerPoints?: number;

  @ApiProperty({
    description: 'The driver who won the race',
    required: false,
  })
  @IsOptional()
  @Type(() => DriverDto)
  winnerDriver?: DriverDto;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}
