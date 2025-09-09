import { HttpStatus } from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Base class for domain-specific errors.
 * It carries information about the appropriate HTTP status for mapping in the application layer.
 */
export class DomainError extends Error {
  public readonly httpStatus: HttpStatus;

  constructor(message: string, httpStatus: HttpStatus) {
    super(message);
    this.name = this.constructor.name;
    this.httpStatus = httpStatus;
  }
}

export class AccountAlreadyClosedError extends DomainError {
  constructor() {
    super('Account is already closed', HttpStatus.CONFLICT);
  }
}

export class AccountBalanceError extends DomainError {
  constructor(message: string) {
    super(message, HttpStatus.BAD_REQUEST);
  }
}

export class InactiveAccountError extends DomainError {
  constructor(operation: string) {
    super(`Account is not active. ${operation} not allowed.`, HttpStatus.BAD_REQUEST);
  }
}

export class BlockedAccountError extends DomainError {
  constructor(operation: string) {
    super(`Account is blocked. ${operation} not allowed.`, HttpStatus.BAD_REQUEST);
  }
}

export class InsufficientBalanceError extends DomainError {
  constructor() {
    super('Insufficient balance for this withdrawal.', HttpStatus.BAD_REQUEST);
  }
}

export class DailyLimitExceededError extends DomainError {
  constructor(limit: number, withdrawn: Decimal) {
    super(`Withdrawal exceeds daily limit of ${limit}. You have already withdrawn ${withdrawn} today.`, HttpStatus.BAD_REQUEST);
  }
}