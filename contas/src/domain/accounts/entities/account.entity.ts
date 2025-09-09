import { Decimal } from '@prisma/client/runtime/library';
import {
  AccountAlreadyClosedError,
  AccountBalanceError,
  BlockedAccountError,
  DailyLimitExceededError,
  InactiveAccountError,
  InsufficientBalanceError,
} from '../exceptions/account.exceptions';
import { randomUUID } from 'crypto';

export class Account {
  id: string;
  holder_cpf: string;
  branch: string;
  number: string;
  balance: Decimal;
  active: boolean;
  blocked: boolean;

  private constructor(props: Partial<Account>) {
    Object.assign(this, props);
  }

  public static create(props: { holder_cpf: string; branch: string }): Account {
    const accountNumber = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');

    return new Account({
      id: randomUUID(),
      holder_cpf: props.holder_cpf,
      branch: props.branch,
      number: accountNumber,
      balance: new Decimal(0),
      active: true,
      blocked: false,
    });
  }

  /**
   * Re-creates an existing Account entity from database data.
   * Use this when you have fetched data and need a "rich" domain object with methods.
   */
  public static reconstitute(props: {
    id: string;
    holder_cpf: string;
    branch: string;
    number: string;
    balance: Decimal;
    active: boolean;
    blocked: boolean;
  }): Account {
    return new Account(props);
  }

  public deposit(amount: Decimal): void {
    if (!this.active) {
      throw new InactiveAccountError('Deposit');
    }
    if (this.blocked) {
      throw new BlockedAccountError('Deposit');
    }
    this.balance = this.balance.plus(amount);
  }

  public withdraw(amount: Decimal, totalWithdrawnToday: Decimal, dailyLimit: number): void {
    if (!this.active) {
      throw new InactiveAccountError('Withdrawal');
    }
    if (this.blocked) {
      throw new BlockedAccountError('Withdrawal');
    }
    if (this.balance.lessThan(amount)) {
      throw new InsufficientBalanceError();
    }
    if (totalWithdrawnToday.plus(amount).greaterThan(dailyLimit)) {
      throw new DailyLimitExceededError(dailyLimit, totalWithdrawnToday);
    }
    this.balance = this.balance.minus(amount);
  }

  public close(): void {
    if (!this.active) {
      throw new AccountAlreadyClosedError();
    }
    if (this.balance.greaterThan(0)) {
      throw new AccountBalanceError('Account with a positive balance cannot be closed');
    }
    this.active = false;
  }

  public block(): void {
    if (!this.active) {
      throw new AccountAlreadyClosedError();
    }
    this.blocked = true;
  }

  public unblock(): void {
    if (!this.active) {
      throw new AccountAlreadyClosedError();
    }
    this.blocked = false;
  }
}