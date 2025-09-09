import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { StatementQueryDto } from './dto/statement.query.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('accounts')
@Controller('accounts')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @ApiOperation({ summary: 'Deposit into an account' })
  @ApiParam({ name: 'id', description: 'The account ID' })
  @ApiResponse({ status: 201, description: 'Deposit successful.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  @Post(':id/deposits')
  deposit(
    @Param('id') account_id: string,
    @Body() depositDto: DepositDto,
  ) {
    return this.transactionsService.deposit(account_id, depositDto);
  }

  @ApiOperation({ summary: 'Withdraw from an account' })
  @ApiParam({ name: 'id', description: 'The account ID' })
  @ApiResponse({ status: 201, description: 'Withdrawal successful.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  @ApiResponse({ status: 409, description: 'Insufficient funds or account is blocked.' })
  @Post(':id/withdrawals')
  withdraw(
    @Param('id') account_id: string,
    @Body() withdrawDto: WithdrawDto,
  ) {
    return this.transactionsService.withdraw(account_id, withdrawDto);
  }

  @ApiOperation({ summary: 'Get account statement' })
  @ApiParam({ name: 'id', description: 'The account ID' })
  @ApiResponse({ status: 200, description: 'Statement retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  @Get(':id/statement')
  getStatement(
    @Param('id') account_id: string,
    @Query() statementQueryDto: StatementQueryDto,
  ) {
    const { startDate, endDate, page, limit } = statementQueryDto;
    return this.transactionsService.getStatement(
      account_id,
      startDate,
      endDate,
      page,
      limit,
    );
  }
}