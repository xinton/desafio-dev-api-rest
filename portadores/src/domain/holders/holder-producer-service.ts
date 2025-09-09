import { Injectable } from '@nestjs/common';
import { MessagingService } from '../../infrastructure/messaging/messaging.service';

@Injectable()
export class HolderProducerService {
  constructor(
    private readonly messagingService: MessagingService,
  ) {}

  /**
   * Publishes an event to the 'holder_created' channel.
   * @param holderData The data of the holder that was created.
   */
  async publishHolderCreated(holderData: any): Promise<void> {
    await this.messagingService.publish('holder_created', holderData);
  }
}