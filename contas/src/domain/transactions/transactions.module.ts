import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CacheModule } from '@nestjs/cache-manager';
import { DAILY_WITHDRAWAL_LIMIT_TOKEN } from './transactions.constants';
import { DepositUseCase } from './use-cases/deposit.use-case';
import { WithdrawUseCase } from './use-cases/withdraw.use-case';
import { GetStatementUseCase } from './use-cases/get-statement.use-case';

@Module({
  imports: [CacheModule.register()],
  controllers: [TransactionsController],
  providers: [
    TransactionsService,
    PrismaService,
    DepositUseCase,
    WithdrawUseCase,
    GetStatementUseCase,
    {
      provide: DAILY_WITHDRAWAL_LIMIT_TOKEN,
      useValue: 2000,
    },
  ],
})
export class TransactionsModule {}