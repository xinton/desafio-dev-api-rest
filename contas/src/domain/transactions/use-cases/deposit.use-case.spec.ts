import { Test, TestingModule } from '@nestjs/testing';
import { DepositUseCase } from './deposit.use-case';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
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

describe('DepositUseCase', () => {
  let useCase: DepositUseCase;
  let prisma: PrismaService;
  let cacheManager: any;

  const mockPrismaService = {
    account: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockCacheManager = {
    del: jest.fn(),
  };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositUseCase,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    useCase = module.get<DepositUseCase>(DepositUseCase);
    prisma = module.get<PrismaService>(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
    jest.clearAllMocks();
  });

  it('should successfully deposit into an active, unblocked account', async () => {
    const depositAmount = new Decimal(100);
    const updatedAccount = {
      ...mockActiveAccount,
      balance: new Decimal(1100),
    };

    mockPrismaService.account.findUnique.mockResolvedValue(mockActiveAccount);
    mockPrismaService.$transaction.mockResolvedValue([updatedAccount]);

    const result = await useCase.execute(mockAccountId, { amount: depositAmount });

    expect(result.balance).toEqual(new Decimal(1100));
    expect(prisma.account.findUnique).toHaveBeenCalledWith({ where: { id: mockAccountId } });
    expect(prisma.$transaction).toHaveBeenCalledWith([
      mockPrismaService.account.update({
        where: { id: mockAccountId },
        data: { balance: new Decimal(1100) },
      }),
      mockPrismaService.transaction.create({
        data: {
          accountId: mockAccountId,
          amount: depositAmount,
          type: 'DEPOSIT',
        },
      }),
    ]);
    expect(cacheManager.del).toHaveBeenCalledWith(`balance_${mockAccountId}`);
  });

  it('should throw NotFoundException if account does not exist', async () => {
    mockPrismaService.account.findUnique.mockResolvedValue(null);
    await expect(
      useCase.execute(mockAccountId, { amount: new Decimal(100) }),
    ).rejects.toThrow(NotFoundException);
  });

  it('should throw HttpException for an inactive account', async () => {
    const inactiveAccount = { ...mockActiveAccount, active: false };
    mockPrismaService.account.findUnique.mockResolvedValue(inactiveAccount);
    await expect(
      useCase.execute(mockAccountId, { amount: new Decimal(100) }),
    ).rejects.toThrow(HttpException);
    await expect(
      useCase.execute(mockAccountId, { amount: new Decimal(100) }),
    ).rejects.toHaveProperty('status', HttpStatus.BAD_REQUEST);
  });

  it('should throw HttpException for a blocked account', async () => {
    const blockedAccount = { ...mockActiveAccount, blocked: true };
    mockPrismaService.account.findUnique.mockResolvedValue(blockedAccount);
    await expect(
      useCase.execute(mockAccountId, { amount: new Decimal(100) }),
    ).rejects.toThrow(HttpException);
    await expect(
      useCase.execute(mockAccountId, { amount: new Decimal(100) }),
    ).rejects.toHaveProperty('status', HttpStatus.BAD_REQUEST);
  });
});