import {
  Injectable,
  NotFoundException,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/prisma/prisma.service';
import { Transaction } from '@prisma/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class GetStatementUseCase {
  private readonly logger = new Logger(GetStatementUseCase.name);

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async execute(
    accountId: string,
    startDate?: string,
    endDate?: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResult<Transaction>> {
    this.logger.log({ accountId, page, limit }, 'Fetching statement');
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      this.logger.error({ accountId }, 'Account not found for statement');
      throw new NotFoundException(`Account with ID ${accountId} not found.`);
    }

    const cacheKey = `statement-${accountId}-${startDate || 'all'}-${
      endDate || 'all'
    }-page${page}-limit${limit}`;
    const cachedResult =
      await this.cacheManager.get<PaginatedResult<Transaction>>(cacheKey);

    if (cachedResult) {
      this.logger.log({ accountId, cacheKey }, 'Returning cached statement');
      return cachedResult;
    }

    const queryStartDate = startDate ? new Date(startDate) : new Date(0);
    const queryEndDate = endDate ? new Date(endDate) : new Date();

    if (queryStartDate > queryEndDate) {
      throw new BadRequestException('Start date cannot be after end date.');
    }

    const whereClause = {
      accountId: accountId,
      createdAt: {
        gte: queryStartDate,
        lte: queryEndDate,
      },
    };

    const [transactions, total] = await this.prisma.$transaction([
      this.prisma.transaction.findMany({
        where: whereClause,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.transaction.count({ where: whereClause }),
    ]);

    const result: PaginatedResult<Transaction> = {
      data: transactions,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    await this.cacheManager.set(cacheKey, result, 60000); // Cache for 60 seconds

    this.logger.log({ accountId, cacheKey }, 'Statement cached');
    return result;
  }
}