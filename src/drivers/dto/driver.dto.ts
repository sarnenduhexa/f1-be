import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class DriverDto {
  @ApiProperty({ description: 'Unique identifier for the driver' })
  @IsString()
  driverId: string;

  @ApiProperty({
    description: 'Permanent number of the driver',
    required: false,
  })
  @IsString()
  @IsOptional()
  permanentNumber?: string;

  @ApiProperty({
    description: 'Driver code (e.g., ALO for Alonso)',
    required: false,
  })
  @IsString()
  @IsOptional()
  code?: string;

  @ApiProperty({ description: "URL to driver's Wikipedia page" })
  @IsString()
  url: string;

  @ApiProperty({ description: "Driver's given name" })
  @IsString()
  givenName: string;

  @ApiProperty({ description: "Driver's family name" })
  @IsString()
  familyName: string;

  @ApiProperty({ description: "Driver's date of birth" })
  @IsDateString()
  dateOfBirth: Date;

  @ApiProperty({ description: "Driver's nationality" })
  @IsString()
  nationality: string;
}
