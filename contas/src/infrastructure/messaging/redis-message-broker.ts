import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { IMessageBroker } from './interfaces/message-broker.interface';

@Injectable()
export class RedisMessageBroker implements IMessageBroker {
  private subscriber: Redis;
  private readonly redisOptions: { host: string; port: number };

  constructor(private readonly configService: ConfigService) {
    this.redisOptions = {
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
    };
  }

  async connect(): Promise<void> {
    this.subscriber = new Redis(this.redisOptions);
  }

  async disconnect(): Promise<void> {
    await this.subscriber?.disconnect();
  }

  async subscribe(
    channel: string,
    callback: (message: any) => Promise<void>
  ): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', async (ch, message) => {
      if (ch === channel) {
        await callback(JSON.parse(message));
      }
    });
  }
}