import { Injectable } from '@nestjs/common';
import { Account, Transaction } from '@prisma/client';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';
import { DepositUseCase } from './use-cases/deposit.use-case';
import { WithdrawUseCase } from './use-cases/withdraw.use-case';
import { GetStatementUseCase } from './use-cases/get-statement.use-case';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly depositUseCase: DepositUseCase,
    private readonly withdrawUseCase: WithdrawUseCase,
    private readonly getStatementUseCase: GetStatementUseCase,
  ) {}

  async deposit(
    accountId: string,
    depositDto: DepositDto,
  ): Promise<Account> {
    return this.depositUseCase.execute(accountId, depositDto);
  }

  async withdraw(
    accountId: string,
    withdrawDto: WithdrawDto,
  ): Promise<Account> {
    return this.withdrawUseCase.execute(accountId, withdrawDto);
  }

  async getStatement(
    accountId: string,
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<Transaction>> {
    return this.getStatementUseCase.execute(
      accountId,
      startDate,
      endDate,
      page,
      limit,
    );
  }
}