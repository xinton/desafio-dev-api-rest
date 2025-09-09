import { Test, TestingModule } from '@nestjs/testing';
import { WithdrawUseCase } from './withdraw.use-case';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { DAILY_WITHDRAWAL_LIMIT_TOKEN } from '../transactions.constants';
import {
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { Account } from '@prisma/client';

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
const dailyLimit = 2000;

describe('WithdrawUseCase', () => {
  let useCase: WithdrawUseCase;
  let prisma: PrismaService;
  let cacheManager: any;

  const mockPrismaService = {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockCacheManager = {
    del: jest.fn(),
  };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WithdrawUseCase,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: DAILY_WITHDRAWAL_LIMIT_TOKEN, useValue: dailyLimit },
      ],
    }).compile();

    useCase = module.get<WithdrawUseCase>(WithdrawUseCase);
    prisma = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
    jest.clearAllMocks();
  });

  it('should successfully withdraw from an account', async () => {
    const withdrawAmount = new Decimal(100);
    const updatedAccount = {
      ...mockActiveAccount,
      balance: new Decimal(900),
    };

    mockPrismaService.account.findUnique.mockResolvedValue(mockActiveAccount);
    mockPrismaService.transaction.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(0) } });
    mockPrismaService.$transaction.mockResolvedValue([updatedAccount]);

    const result = await useCase.execute(mockAccountId, { amount: withdrawAmount });

    expect(result.balance).toEqual(new Decimal(900));
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(cacheManager.del).toHaveBeenCalledWith(`balance_${mockAccountId}`);
  });

  it('should throw HttpException for insufficient balance', async () => {
    mockPrismaService.account.findUnique.mockResolvedValue(mockActiveAccount);
    mockPrismaService.transaction.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(0) } });

    await expect(
      useCase.execute(mockAccountId, { amount: new Decimal(2000) }),
    ).rejects.toThrow(HttpException);
  });

  it('should throw HttpException if daily withdrawal limit is exceeded', async () => {
    mockPrismaService.account.findUnique.mockResolvedValue(mockActiveAccount);
    mockPrismaService.transaction.aggregate.mockResolvedValue({ _sum: { amount: new Decimal(1900) } });

    await expect(
      useCase.execute(mockAccountId, { amount: new Decimal(200) }),
    ).rejects.toThrow(HttpException);
  });

  it('should throw NotFoundException if account does not exist', async () => {
    mockPrismaService.account.findUnique.mockResolvedValue(null);
    await expect(
      useCase.execute(mockAccountId, { amount: new Decimal(100) }),
    ).rejects.toThrow(NotFoundException);
  });
});