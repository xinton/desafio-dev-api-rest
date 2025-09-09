import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateHolderDto {
  @ApiProperty({
    example: '12345678901',
    description: 'The CPF of the holder (only numbers)',
    minLength: 11,
    maxLength: 11,
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{11}$/, {
    message: 'CPF deve conter exatamente 11 dígitos numéricos',
  })
  cpf: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the holder',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}