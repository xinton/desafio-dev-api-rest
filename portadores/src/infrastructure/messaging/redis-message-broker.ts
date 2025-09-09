import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import type { IMessageBroker } from './interfaces/message-broker.interface';

@Injectable()
export class RedisMessageBroker implements IMessageBroker {
  private subscriber: Redis;
  private publisher: Redis;
  private readonly redisOptions: { host: string; port: number };

  constructor(private readonly configService: ConfigService) {
    this.redisOptions = {
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: Number(this.configService.get('REDIS_PORT', 6379)),
    };
  }

  async connect(): Promise<void> {
    this.subscriber = new Redis(this.redisOptions);
    this.publisher = new Redis(this.redisOptions);
  }

  async disconnect(): Promise<void> {
    await this.subscriber?.disconnect();
    await this.publisher?.disconnect();
  }

  async publish(channel: string, message: any): Promise<void> {
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async subscribe(channel: string, callback: (message: any) => Promise<void>): Promise<void> {
    await this.subscriber.subscribe(channel);
    this.subscriber.on('message', async (ch, message) => {
      if (ch === channel) {
        await callback(JSON.parse(message));
      }
    });
  }
}