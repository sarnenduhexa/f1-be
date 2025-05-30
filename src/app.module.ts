import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ScheduleModule } from '@nestjs/schedule';
import { SeasonsModule } from './seasons/seasons.module';
import { RacesModule } from './races/races.module';
import { DriversModule } from './drivers/drivers.module';
import { HealthModule } from './health/health.module';
import { JobsModule } from './jobs/jobs.module';
import configuration from './config/configuration';
import { createKeyv, Keyv } from '@keyv/redis';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const stores: Keyv[] = [];
        if (configService.get('cache.redis.enabled')) {
          stores.push(
            createKeyv(
              `redis://${configService.get('cache.redis.host')}:${configService.get('cache.redis.port')}`,
            ),
          );
        }
        return {
          stores,
          ttl: configService.get('cache.ttl'),
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('database.synchronize'),
      }),
      inject: [ConfigService],
    }),
    ScheduleModule.forRoot(),
    SeasonsModule,
    RacesModule,
    DriversModule,
    HealthModule,
    JobsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
