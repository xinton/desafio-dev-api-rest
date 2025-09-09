import { Test, TestingModule } from '@nestjs/testing';
import { GetStatementUseCase } from './get-statement.use-case';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    NotFoundException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { Account, Transaction } from '@prisma/client';

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

describe('GetStatementUseCase', () => {
    let useCase: GetStatementUseCase;
    let prisma: PrismaService;
    let cacheManager: any;

    const mockPrismaService = {
        account: {
            findUnique: jest.fn(),
        },
        transaction: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        $transaction: jest.fn(),
    };

    const mockCacheManager = {
        get: jest.fn(),
        set: jest.fn(),
    };

    beforeAll(() => {
        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetStatementUseCase,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
            ],
        }).compile();

        useCase = module.get<GetStatementUseCase>(GetStatementUseCase);
        prisma = module.get<PrismaService>(PrismaService);
        cacheManager = module.get(CACHE_MANAGER);
        jest.clearAllMocks();
    });

    it('should return a paginated list of transactions from the database', async () => {
        const transactions: Transaction[] = [
            { id: 'tx-1', accountId: mockAccountId, amount: new Decimal(100), type: 'DEPOSIT', createdAt: new Date() },
        ];
        mockPrismaService.account.findUnique.mockResolvedValue(mockActiveAccount);
        mockCacheManager.get.mockResolvedValue(null); // No cache
        mockPrismaService.$transaction.mockResolvedValue([transactions, 1]);

        const result = await useCase.execute(mockAccountId);

        expect(result.data).toEqual(transactions);
        expect(result.total).toBe(1);
        expect(prisma.$transaction).toHaveBeenCalled();
        expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should return a cached statement if available', async () => {
        const cachedResult = { data: [], total: 0, page: 1, limit: 10, totalPages: 0 };
        mockPrismaService.account.findUnique.mockResolvedValue(mockActiveAccount);
        mockCacheManager.get.mockResolvedValue(cachedResult);

        const result = await useCase.execute(mockAccountId);

        expect(result).toEqual(cachedResult);
        expect(cacheManager.get).toHaveBeenCalled();
        expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if account does not exist', async () => {
        mockPrismaService.account.findUnique.mockResolvedValue(null);
        await expect(useCase.execute(mockAccountId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if start date is after end date', async () => {
        mockPrismaService.account.findUnique.mockResolvedValue(mockActiveAccount);
        mockCacheManager.get.mockResolvedValue(null); // Explicitly mock a cache miss
        const startDate = '2025-02-01';
        const endDate = '2025-01-01';

        await expect(useCase.execute(mockAccountId, startDate, endDate)).rejects.toThrow(BadRequestException);
    });
});