import { Module } from '@nestjs/common';
import { HoldersModule } from './domain/holders/holders.module';
import { HealthModule } from './infrastructure/health/health.module';

@Module({
  imports: [HoldersModule, HealthModule],
})
export class AppModule {}