import { Controller, Post, Body, Delete, Patch, Param, Get } from '@nestjs/common';
import { AccountsService } from './accounts.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('accounts')
@Controller('accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'The account has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Invalid input or holder not found.' })
  create(@Body() createAccountDto: CreateAccountDto) {
    return this.accountsService.create(createAccountDto);
  }

  @Get(':id/balance')
  @ApiOperation({ summary: 'Get account balance' })
  @ApiResponse({ status: 200, description: 'Returns the account balance.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  getBalance(@Param('id') id: string) {
    return this.accountsService.getBalance(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Close an account' })
  @ApiResponse({ status: 200, description: 'The account has been successfully closed.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  close(@Param('id') id: string) {
    return this.accountsService.close(id);
  }

  @Patch(':id/block')
  @ApiOperation({ summary: 'Block an account' })
  @ApiResponse({ status: 200, description: 'The account has been successfully blocked.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  block(@Param('id') id: string) {
    return this.accountsService.block(id);
  }

  @Patch(':id/unblock')
  @ApiOperation({ summary: 'Unblock an account' })
  @ApiResponse({ status: 200, description: 'The account has been successfully unblocked.' })
  @ApiResponse({ status: 404, description: 'Account not found.' })
  @ApiParam({ name: 'id', description: 'Account ID' })
  unblock(@Param('id') id: string) {
    return this.accountsService.unblock(id);
  }
}