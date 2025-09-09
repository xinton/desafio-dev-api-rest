import { Test, TestingModule } from '@nestjs/testing';
import { TransactionsService } from './transactions.service';
import { DepositUseCase } from './use-cases/deposit.use-case';
import { WithdrawUseCase } from './use-cases/withdraw.use-case';
import { GetStatementUseCase } from './use-cases/get-statement.use-case';
import { Account, Transaction } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DepositDto } from './dto/deposit.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

// Mock data
const mockAccountId = 'some-account-id';
const mockActiveAccount: Account = { 
  id: mockAccountId,
  number: '123456',
  branch: '0001',
  holder_cpf: '123.456.789-00',
  balance: new Decimal(1000),
  active: true,
  blocked: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('TransactionsService', () => {
  let service: TransactionsService;
  let depositUseCase: DepositUseCase;
  let withdrawUseCase: WithdrawUseCase;
  let getStatementUseCase: GetStatementUseCase;

  const mockDepositUseCase = {
    execute: jest.fn(),
  };

  const mockWithdrawUseCase = {
    execute: jest.fn(),
  };

  const mockGetStatementUseCase = {
    execute: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransactionsService,
        { provide: DepositUseCase, useValue: mockDepositUseCase },
        { provide: WithdrawUseCase, useValue: mockWithdrawUseCase },
        { provide: GetStatementUseCase, useValue: mockGetStatementUseCase },
      ],
    }).compile();

    service = module.get<TransactionsService>(TransactionsService);
    depositUseCase = module.get<DepositUseCase>(DepositUseCase);
    withdrawUseCase = module.get<WithdrawUseCase>(WithdrawUseCase);
    getStatementUseCase = module.get<GetStatementUseCase>(GetStatementUseCase);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deposit', () => {
    it('should call DepositUseCase.execute with the correct parameters', async () => {
      const depositDto: DepositDto = { amount: new Decimal(100) };
      mockDepositUseCase.execute.mockResolvedValue({});

      await service.deposit(mockAccountId, depositDto);

      expect(depositUseCase.execute).toHaveBeenCalledWith(
        mockAccountId,
        depositDto,
      );
    });

    it('should propagate exceptions from DepositUseCase', async () => {
      const depositDto: DepositDto = { amount: new Decimal(100) };
      mockDepositUseCase.execute.mockRejectedValue(new NotFoundException());

      await expect(service.deposit(mockAccountId, depositDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('withdraw', () => {
    it('should call WithdrawUseCase.execute with the correct parameters', async () => {
      const withdrawDto: WithdrawDto = { amount: new Decimal(100) };
      mockWithdrawUseCase.execute.mockResolvedValue({});

      await service.withdraw(mockAccountId, withdrawDto);

      expect(withdrawUseCase.execute).toHaveBeenCalledWith(
        mockAccountId,
        withdrawDto,
      );
    });

    it('should propagate exceptions from WithdrawUseCase', async () => {
      const withdrawDto: WithdrawDto = { amount: new Decimal(100) };
      mockWithdrawUseCase.execute.mockRejectedValue(new BadRequestException());

      await expect(
        service.withdraw(mockAccountId, withdrawDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getStatement', () => {
    it('should call GetStatementUseCase.execute with the correct parameters', async () => {
      mockGetStatementUseCase.execute.mockResolvedValue({});
      const startDate = '2025-01-01';
      const endDate = '2025-01-31';
      const page = 2;
      const limit = 20;

      await service.getStatement(mockAccountId, startDate, endDate, page, limit);

      expect(getStatementUseCase.execute).toHaveBeenCalledWith(
        mockAccountId,
        startDate,
        endDate,
        page,
        limit,
      );
    });

    it('should propagate exceptions from GetStatementUseCase', async () => {
        mockGetStatementUseCase.execute.mockRejectedValue(new NotFoundException());

        await expect(service.getStatement(mockAccountId)).rejects.toThrow(NotFoundException);
    });
  });
});