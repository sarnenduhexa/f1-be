import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class SeasonDto {
  @ApiProperty({ description: 'The year of the F1 season' })
  @IsNumber()
  year: number;

  @ApiProperty({ description: 'The URL to the season details' })
  @IsString()
  url: string;
} 