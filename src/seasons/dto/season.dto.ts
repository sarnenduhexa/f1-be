import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';
import { DriverDto } from '../../drivers/dto/driver.dto';

export class SeasonDto {
  @ApiProperty({ description: 'The year of the F1 season' })
  @IsNumber()
  year: number;

  @ApiProperty({ description: 'The URL to the season details' })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'The driver who won the season',
    required: false,
  })
  @IsOptional()
  winner?: DriverDto;
}
