import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { DepositDto } from '../dto/deposit.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Account } from '../../accounts/entities/account.entity';
import { DomainError } from '../../accounts/exceptions/account.exceptions';
import { Account as AccountModel } from '@prisma/client';

@Injectable()
export class DepositUseCase {
  private readonly logger = new Logger(DepositUseCase.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async execute(
    accountId: string,
    depositDto: DepositDto,
  ): Promise<AccountModel> {
    const { amount } = depositDto;
    this.logger.log(
      { accountId, amount },
      `Attempting to deposit into account`,
    );

    const accountData = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!accountData) {
      this.logger.error({ accountId }, `Account not found for deposit`);
      throw new NotFoundException(`Account with ID ${accountId} not found.`);
    }

    const accountEntity = Account.reconstitute(accountData);

    try {
      accountEntity.deposit(new Decimal(amount));
    } catch (error) {
      this.logger.warn({ accountId, error: error.message }, 'Failed to deposit');
      if (error instanceof DomainError) {
        throw new HttpException(error.message, error.httpStatus);
      }
      throw error;
    }

    const [updatedAccount] = await this.prisma.$transaction([
      this.prisma.account.update({
        where: { id: accountId },
        data: { balance: accountEntity.balance },
      }),
      this.prisma.transaction.create({
        data: {
          accountId: accountId,
          amount: amount,
          type: 'DEPOSIT',
        },
      }),
    ]);

    this.logger.log(
      { accountId, amount, newBalance: updatedAccount.balance },
      'Deposit successful',
    );
    await this.cacheManager.del(`balance_${accountId}`);
    return updatedAccount;
  }
}