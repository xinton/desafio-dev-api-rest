import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AccountsService } from './accounts.service';
import { AccountsController } from './accounts.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';
import { MessagingService } from '../../infrastructure/messaging/messaging.service';
import { RedisMessageBroker } from '../../infrastructure/messaging/redis-message-broker';
import { AccountConsumerService } from './account-consumer.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    HttpModule,
    CacheModule.register({
      isGlobal: true,
      ttl: 60000, // 60 seconds
    }),
  ],
  controllers: [AccountsController],
  providers: [
    AccountsService,
    PrismaService,
    MessagingService,
    AccountConsumerService,
    { provide: 'IMessageBroker', useClass: RedisMessageBroker },
  ],
})
export class AccountsModule {}