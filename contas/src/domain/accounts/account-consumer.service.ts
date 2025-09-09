import { Injectable, OnModuleInit } from '@nestjs/common';
import { MessagingService } from '../../infrastructure/messaging/messaging.service';
import { AccountsService } from './accounts.service';

@Injectable()
export class AccountConsumerService implements OnModuleInit {
  constructor(
    private readonly messagingService: MessagingService,
    private readonly accountsService: AccountsService,
  ) {}

  async onModuleInit() {
    await this.setupSubscriptions();
  }

  private async setupSubscriptions() {
    await this.messagingService.subscribeToHolderCreated(async (holderData) => {
      console.log('Received holder_created event, creating account...', holderData);
      await this.accountsService.create({
        holder_cpf: holderData.cpf,
        branch: '0001',
      });
    });
  }
}