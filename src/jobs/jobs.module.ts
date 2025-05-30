import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { SeasonsModule } from '../seasons/seasons.module';
import { RacesModule } from '../races/races.module';

@Module({
  imports: [SeasonsModule, RacesModule],
  providers: [JobsService],
})
export class JobsModule {}
