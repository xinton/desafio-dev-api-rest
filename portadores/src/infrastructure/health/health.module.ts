import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { PrismaClient } from '@prisma/client';

@Module({
  imports: [
    TerminusModule,
    HttpModule,
  ],
  controllers: [HealthController],
  providers: [PrismaClient],
})
export class HealthModule {}