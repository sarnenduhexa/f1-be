import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { SeasonsModule } from './seasons/seasons.module';
import { RacesModule } from './races/races.module';
import { DriversModule } from './drivers/drivers.module';
import { HealthModule } from './health/health.module';
import configuration from './config/configuration';
import { createKeyv, Keyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';

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
        return {
          stores: [
            new Keyv({
              store: new CacheableMemory({
                ttl: configService.get('redis.ttl'),
                lruSize: configService.get('redis.max'),
              }),
            }),
            createKeyv(
              `redis://${configService.get('redis.host')}:${configService.get('redis.port')}`,
            ),
          ],
          ttl: configService.get('redis.ttl'),
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
    SeasonsModule,
    RacesModule,
    DriversModule,
    HealthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
