import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  HttpException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { WithdrawDto } from '../dto/withdraw.dto';
import { Decimal } from '@prisma/client/runtime/library';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { DAILY_WITHDRAWAL_LIMIT_TOKEN } from '../transactions.constants';
import { Account } from '../../accounts/entities/account.entity';
import { DomainError } from '../../accounts/exceptions/account.exceptions';
import { Account as AccountModel } from '@prisma/client';

@Injectable()
export class WithdrawUseCase {
  private readonly logger = new Logger(WithdrawUseCase.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(DAILY_WITHDRAWAL_LIMIT_TOKEN)
    private readonly dailyWithdrawalLimit: number,
  ) {}

  async execute(
    accountId: string,
    withdrawDto: WithdrawDto,
  ): Promise<AccountModel> {
    const { amount } = withdrawDto;
    this.logger.log(
      { accountId, amount },
      `Attempting to withdraw from account`,
    );

    const accountData = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!accountData) {
      this.logger.error({ accountId }, `Account not found for withdrawal`);
      throw new NotFoundException(`Account with ID ${accountId} not found.`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaysWithdrawals = await this.prisma.transaction.aggregate({
      _sum: { amount: true },
      where: {
        accountId: accountId,
        type: 'WITHDRAWAL',
        createdAt: { gte: today, lt: tomorrow },
      },
    });
    const totalWithdrawnToday =
      todaysWithdrawals._sum?.amount || new Decimal(0);

    const accountEntity = Account.reconstitute(accountData);

    try {
      accountEntity.withdraw(
        new Decimal(amount),
        totalWithdrawnToday,
        this.dailyWithdrawalLimit,
      );
    } catch (error) {
      this.logger.warn({ accountId, error: error.message }, 'Failed to withdraw');
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
          type: 'WITHDRAWAL',
        },
      }),
    ]);

    this.logger.log(
      { accountId, amount, newBalance: updatedAccount.balance },
      'Withdrawal successful',
    );
    await this.cacheManager.del(`balance_${accountId}`);
    return updatedAccount;
  }
}