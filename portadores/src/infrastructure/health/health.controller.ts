import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MicroserviceHealthIndicator,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaClient } from '@prisma/client';
import { Transport } from '@nestjs/microservices';

@Controller('health')
export class HealthController {
  private readonly prisma = new PrismaClient();

  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: PrismaHealthIndicator,
    private microservice: MicroserviceHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database', this.prisma),
      () =>
        this.microservice.pingCheck('redis', {
          transport: Transport.REDIS,
          options: {
            host: 'localhost',
            port: 6379,
          },
        }),
    ]);
  }
}