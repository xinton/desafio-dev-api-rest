import { Decimal } from '@prisma/client/runtime/library';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class WithdrawDto {
  @IsNumber()
  @IsPositive({ message: 'The withdrawal amount must be a positive number.' })
  @IsNotEmpty()
  amount: Decimal;
}