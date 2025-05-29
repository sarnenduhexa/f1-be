import { Controller, Get, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    this.logger.debug('Checking health');
    return this.health.check([
      // HTTP health check
      // As this is rate limited, this is not reliable.
      // This is the way to implement it in future.
      // () => this.http.pingCheck('jolpi.api', 'https://api.jolpi.ca/'),
      // Database health check
      () => this.db.pingCheck('database'),
    ]);
  }
}
