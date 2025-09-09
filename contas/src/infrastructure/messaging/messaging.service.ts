import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
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

  async subscribeToHolderCreated(callback: (message: any) => Promise<void>): Promise<void> {
    await this.messageBroker.subscribe('holder_created', callback);
  }
}