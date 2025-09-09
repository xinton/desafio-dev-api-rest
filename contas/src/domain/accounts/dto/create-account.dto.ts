import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateAccountDto {
  @ApiProperty({
    example: '12345678901',
    description: 'CPF of the account holder',
    minLength: 11,
    maxLength: 11,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, {
    message: 'CPF deve conter exatamente 11 dígitos numéricos',
  })
  holder_cpf: string;

  @ApiProperty({
    example: '0001',
    description: 'The account branch number',
  })
  @IsString()
  @IsNotEmpty()
  branch: string;
}