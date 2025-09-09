import { Test, TestingModule } from '@nestjs/testing';
import { AccountsService } from './accounts.service';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Decimal } from '@prisma/client/runtime/library';
import { Account } from '@prisma/client';
import { AxiosError } from 'axios';
import { CreateAccountDto } from './dto/create-account.dto';
import {
    ConflictException,
    NotFoundException,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';

// Mock data
const mockAccountId = 'some-account-id';
const mockHolderCpf = '123.456.789-00';

const mockAccount: Account = {
    id: mockAccountId,
    number: '12345678',
    branch: '0001',
    holder_cpf: mockHolderCpf,
    balance: new Decimal(0),
    active: true,
    blocked: false,
    createdAt: new Date(),
    updatedAt: new Date(),
};

const createAccountDto: CreateAccountDto = {
    branch: '0001',
    holder_cpf: mockHolderCpf,
};

describe('AccountsService', () => {
    let service: AccountsService;
    let prisma: PrismaService;
    let httpService: HttpService;
    let cacheManager: any;

    const mockPrismaService = {
        account: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
        },
    };

    const mockHttpService = {
        axiosRef: {
            get: jest.fn(),
        },
    };

    const mockCacheManager = {
        get: jest.fn(),
        set: jest.fn(),
    };

    beforeAll(() => {
        // Suppress logger output during tests
        jest.spyOn(Logger.prototype, 'log').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => { });
        jest.spyOn(Logger.prototype, 'error').mockImplementation(() => { });
    });

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AccountsService,
                { provide: PrismaService, useValue: mockPrismaService },
                { provide: HttpService, useValue: mockHttpService },
                { provide: CACHE_MANAGER, useValue: mockCacheManager },
            ],
        }).compile();

        service = module.get<AccountsService>(AccountsService);
        prisma = module.get<PrismaService>(PrismaService);
        httpService = module.get<HttpService>(HttpService);
        cacheManager = module.get(CACHE_MANAGER);

        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create', () => {
        it('should create a new account successfully', async () => {
            mockHttpService.axiosRef.get.mockResolvedValue({ data: {} });
            mockPrismaService.account.findUnique.mockResolvedValue(null);
            mockPrismaService.account.create.mockResolvedValue(mockAccount);

            const result = await service.create(createAccountDto);

            expect(result).toEqual(mockAccount);
            expect(httpService.axiosRef.get).toHaveBeenCalledWith(
                `http://localhost:3001/holders/${createAccountDto.holder_cpf}`,
            );
            expect(prisma.account.findUnique).toHaveBeenCalledWith({
                where: { holder_cpf: createAccountDto.holder_cpf },
            });
            expect(prisma.account.create).toHaveBeenCalled();
        });

        it('should throw NotFoundException if holder does not exist', async () => {
            const axiosError = new AxiosError('Not Found');
            axiosError.response = { status: 404, data: {}, statusText: 'Not Found', headers: {}, config: {} as any };
            mockHttpService.axiosRef.get.mockRejectedValue(axiosError);

            await expect(service.create(createAccountDto)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ConflictException if holder already has an account', async () => {
            mockHttpService.axiosRef.get.mockResolvedValue({ data: {} });
            mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);

            await expect(service.create(createAccountDto)).rejects.toThrow(
                ConflictException,
            );
        });
    });

    describe('close', () => {
        it('should close an active account with zero balance', async () => {
            const updatedAccount = { ...mockAccount, active: false };
            mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
            mockPrismaService.account.update.mockResolvedValue(updatedAccount);

            const result = await service.close(mockAccountId);

            expect(result.active).toBe(false);
            expect(prisma.account.update).toHaveBeenCalledWith({
                where: { id: mockAccountId },
                data: { active: false },
            });
        });

        it('should throw NotFoundException if account does not exist', async () => {
            mockPrismaService.account.findUnique.mockResolvedValue(null);
            await expect(service.close(mockAccountId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ConflictException if account is already closed', async () => {
            const closedAccount = { ...mockAccount, active: false };
            mockPrismaService.account.findUnique.mockResolvedValue(closedAccount);

            await expect(service.close(mockAccountId)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should throw HttpException if account has a positive balance', async () => {
            const accountWithBalance = {
                ...mockAccount,
                balance: new Decimal(100),
            };
            mockPrismaService.account.findUnique.mockResolvedValue(
                accountWithBalance,
            );

            await expect(service.close(mockAccountId)).rejects.toThrow(
                new HttpException(
                    'Account with a positive balance cannot be closed',
                    HttpStatus.BAD_REQUEST,
                ),
            );
        });
    });

    describe('block', () => {
        it('should block an active account', async () => {
            const updatedAccount = { ...mockAccount, blocked: true };
            mockPrismaService.account.findUnique.mockResolvedValue(mockAccount);
            mockPrismaService.account.update.mockResolvedValue(updatedAccount);

            const result = await service.block(mockAccountId);

            expect(result.blocked).toBe(true);
            expect(prisma.account.update).toHaveBeenCalledWith({
                where: { id: mockAccountId },
                data: { blocked: true },
            });
        });

        it('should throw NotFoundException if account does not exist', async () => {
            mockPrismaService.account.findUnique.mockResolvedValue(null);
            await expect(service.block(mockAccountId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ConflictException if account is closed', async () => {
            const closedAccount = { ...mockAccount, active: false };
            mockPrismaService.account.findUnique.mockResolvedValue(closedAccount);

            await expect(service.block(mockAccountId)).rejects.toThrow(
                ConflictException,
            );
        });
    });

    describe('unblock', () => {
        it('should unblock a blocked account', async () => {
            const blockedAccount = { ...mockAccount, blocked: true };
            const updatedAccount = { ...mockAccount, blocked: false };
            mockPrismaService.account.findUnique.mockResolvedValue(blockedAccount);
            mockPrismaService.account.update.mockResolvedValue(updatedAccount);

            const result = await service.unblock(mockAccountId);

            expect(result.blocked).toBe(false);
            expect(prisma.account.update).toHaveBeenCalledWith({
                where: { id: mockAccountId },
                data: { blocked: false },
            });
        });

        it('should throw NotFoundException if account does not exist', async () => {
            mockPrismaService.account.findUnique.mockResolvedValue(null);
            await expect(service.unblock(mockAccountId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw ConflictException if account is closed', async () => {
            const closedAccount = { ...mockAccount, active: false };
            mockPrismaService.account.findUnique.mockResolvedValue(closedAccount);

            await expect(service.unblock(mockAccountId)).rejects.toThrow(
                ConflictException,
            );
        });
    });

    describe('getBalance', () => {
        it('should return balance from cache if available', async () => {
            const cachedBalance = { balance: new Decimal(500) };
            mockCacheManager.get.mockResolvedValue(cachedBalance);

            const result = await service.getBalance(mockAccountId);

            expect(result).toEqual(cachedBalance);
            expect(cacheManager.get).toHaveBeenCalledWith(`balance_${mockAccountId}`);
            expect(prisma.account.findUnique).not.toHaveBeenCalled();
        });

        it('should fetch balance from db, cache it, and return it', async () => {
            const dbBalance = { balance: new Decimal(1000) };
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.account.findUnique.mockResolvedValue(dbBalance);

            const result = await service.getBalance(mockAccountId);

            expect(result).toEqual(dbBalance);
            expect(cacheManager.get).toHaveBeenCalledWith(`balance_${mockAccountId}`);
            expect(prisma.account.findUnique).toHaveBeenCalledWith({
                where: { id: mockAccountId },
                select: { balance: true },
            });
            expect(cacheManager.set).toHaveBeenCalledWith(
                `balance_${mockAccountId}`,
                dbBalance,
            );
        });

        it('should throw NotFoundException if account does not exist', async () => {
            mockCacheManager.get.mockResolvedValue(null);
            mockPrismaService.account.findUnique.mockResolvedValue(null);

            await expect(service.getBalance(mockAccountId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });
});