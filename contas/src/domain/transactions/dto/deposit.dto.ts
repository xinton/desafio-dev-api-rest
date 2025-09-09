import { Decimal } from '@prisma/client/runtime/library';
import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class DepositDto {
  @IsNumber()
  @IsPositive({ message: 'O valor do depósito deve ser positivo.' })
  @IsNotEmpty()
  amount: Decimal;
}