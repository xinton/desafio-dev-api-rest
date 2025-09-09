import { Inject, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import type { IMessageBroker } from './interfaces/message-broker.interface';

@Injectable()
export class MessagingService implements OnModuleInit, OnModuleDestroy {
  constructor(
    @Inject('IMessageBroker') private readonly messageBroker: IMessageBroker,
  ) {}

  async onModuleInit() {
    await this.messageBroker.connect();
  }

  async onModuleDestroy() {
    await this.messageBroker.disconnect();
  }

  async publish(channel: string, message: any): Promise<void> {
    await this.messageBroker.publish(channel, message);
  }
}