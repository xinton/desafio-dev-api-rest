import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HoldersService } from './holders.service';
import { HoldersController } from './holders.controller';
import { PrismaService } from '../../infrastructure/prisma.service';
import { RedisMessageBroker } from 'src/infrastructure/messaging/redis-message-broker';
import { MessagingService } from 'src/infrastructure/messaging/messaging.service';
import { HolderProducerService } from './holder-producer-service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
  ],
  controllers: [HoldersController],
  providers: [
    HoldersService,
    PrismaService,
    MessagingService,
    HolderProducerService,
    {
      provide: 'IMessageBroker',
      useClass: RedisMessageBroker,
    },
  ],
})
export class HoldersModule {}