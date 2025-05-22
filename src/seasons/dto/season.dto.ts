import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsOptional } from 'class-validator';
import { DriverDto } from '../../drivers/dto/driver.dto';
import { Exclude, Type } from 'class-transformer';

export class SeasonDto {
  @ApiProperty({ description: 'The year of the F1 season' })
  @IsNumber()
  year: number;

  @ApiProperty({ description: 'The URL to the season details' })
  @IsString()
  url: string;

  @ApiProperty({
    description: 'The ID of the driver who won the season',
    required: false,
  })
  @IsString()
  @IsOptional()
  winnerDriverId?: string;

  @ApiProperty({
    description: 'The driver who won the season',
    required: false,
  })
  @IsOptional()
  @Type(() => DriverDto)
  winner?: DriverDto;

  @Exclude()
  createdAt: Date;

  @Exclude()
  updatedAt: Date;
}
