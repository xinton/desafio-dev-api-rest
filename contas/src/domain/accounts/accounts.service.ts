import { Inject, Injectable, ConflictException, NotFoundException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { HttpService } from '@nestjs/axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Decimal } from '@prisma/client/runtime/library';
import { Account } from './entities/account.entity';
import { AxiosError } from 'axios';
import { DomainError } from './exceptions/account.exceptions';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AccountsService {
  private readonly logger = new Logger(AccountsService.name);
  private readonly portadoresApiUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private httpService: HttpService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    this.portadoresApiUrl = this.configService.getOrThrow<string>('PORTADORES_API_URL');
  }

  async create(createAccountDto: CreateAccountDto) {
    this.logger.log({ holder_cpf: createAccountDto.holder_cpf }, 'Starting account creation process');
    // Verify if holder exists
    try {
      await this.httpService.axiosRef.get(
        `${this.portadoresApiUrl}/holders/${createAccountDto.holder_cpf}`,
      );
    } catch (error) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        this.logger.error({ holder_cpf: createAccountDto.holder_cpf, error: error.stack }, 'Holder not found');
        throw new NotFoundException('Holder not found');
      }
      throw error;
    }

    // Check if holder already has an account
    const existingAccount = await this.prisma.account.findUnique({
      where: { holder_cpf: createAccountDto.holder_cpf },
    });

    if (existingAccount) {
      this.logger.warn({ holder_cpf: createAccountDto.holder_cpf }, 'Holder already has an account.');
      throw new ConflictException('Holder already has an account');
    }

    const newAccountEntity = Account.create({
      holder_cpf: createAccountDto.holder_cpf,
      branch: createAccountDto.branch,
    });

    const newAccount = await this.prisma.account.create({
      data: newAccountEntity,
    });

    this.logger.log({ holder_cpf: createAccountDto.holder_cpf, accountId: newAccount.id }, 'Account created successfully');
    return newAccount;
  }

  async close(id: string) {
    this.logger.log({ accountId: id }, 'Starting account closing process');
    const accountData = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!accountData) {
      this.logger.warn({ accountId: id }, 'Attempt to close non-existent account');
      throw new NotFoundException('Account not found');
    }

    const accountEntity = Account.reconstitute(accountData);

    try {
      accountEntity.close();
    } catch (error) {
      this.logger.warn({ accountId: id, error: error.message }, 'Failed to close account');

      if (error instanceof DomainError) {
        if (error.httpStatus === HttpStatus.CONFLICT) {
          throw new ConflictException(error.message);
        }
        throw new HttpException(error.message, error.httpStatus);
      }
      throw error;
    }

    const updatedAccount = await this.prisma.account.update({
      where: { id },
      data: { active: accountEntity.active },
    });
    this.logger.log({ accountId: id }, 'Account closed successfully.');
    return updatedAccount;
  }

  async block(id: string) {
    this.logger.log({ accountId: id }, 'Starting account blocking process');
    const accountData = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!accountData) {
      this.logger.warn({ accountId: id }, 'Attempt to block non-existent account');
      throw new NotFoundException('Account not found');
    }

    const accountEntity = Account.reconstitute(accountData);

    try {
      accountEntity.block();
    } catch (error) {
      this.logger.warn({ accountId: id, error: error.message }, 'Failed to block account');
      if (error instanceof DomainError) {
        if (error.httpStatus === HttpStatus.CONFLICT) {
          throw new ConflictException(error.message);
        }
        throw new HttpException(error.message, error.httpStatus);
      }
      throw error;
    }

    const updatedAccount = await this.prisma.account.update({
      where: { id },
      data: { blocked: accountEntity.blocked },
    });
    this.logger.log({ accountId: id }, 'Account blocked successfully.');
    return updatedAccount;
  }

  async unblock(id: string) {
    this.logger.log({ accountId: id }, 'Starting account unblocking process');
    const accountData = await this.prisma.account.findUnique({
      where: { id },
    });

    if (!accountData) {
      this.logger.warn({ accountId: id }, 'Attempt to unblock non-existent account');
      throw new NotFoundException('Account not found');
    }

    const accountEntity = Account.reconstitute(accountData);

    try {
      accountEntity.unblock();
    } catch (error) {
      this.logger.warn({ accountId: id, error: error.message }, 'Failed to unblock account');
      if (error instanceof DomainError) {
        if (error.httpStatus === HttpStatus.CONFLICT) {
          throw new ConflictException(error.message);
        }
        throw new HttpException(error.message, error.httpStatus);
      }
      throw error;
    }

    const updatedAccount = await this.prisma.account.update({
      where: { id },
      data: { blocked: accountEntity.blocked },
    });
    this.logger.log({ accountId: id }, 'Account unblocked successfully.');
    return updatedAccount;
  }

  async getBalance(id: string): Promise<{ balance: Decimal }> {
    const cacheKey = `balance_${id}`;
    const cachedBalance = await this.cacheManager.get<{ balance: Decimal }>(
      cacheKey,
    );

    if (cachedBalance) {
      this.logger.log({ accountId: id }, 'Balance returned from cache.');
      return cachedBalance;
    }

    this.logger.log({ accountId: id }, 'Fetching balance from database.');
    const account = await this.prisma.account.findUnique({
      where: { id },
      select: { balance: true },
    });

    if (!account) {
      this.logger.warn({ accountId: id }, 'Attempt to get balance of non-existent account');
      throw new NotFoundException('Account not found');
    }

    // Cache Balance
    await this.cacheManager.set(cacheKey, { balance: account.balance });
    this.logger.log({ accountId: id }, 'Balance stored in cache.');

    return { balance: account.balance };
  }
}