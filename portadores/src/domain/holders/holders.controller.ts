import { Controller, Post, Body, Delete, Param, Get, NotFoundException } from '@nestjs/common';
import { HoldersService } from './holders.service';
import { CreateHolderDto } from './dto/create-holder.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('holders')
@Controller('holders')
export class HoldersController {
  constructor(private readonly holdersService: HoldersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new holder' })
  @ApiResponse({ status: 201, description: 'The holder has been successfully created.'})
  @ApiResponse({ status: 400, description: 'Invalid input.'})
  create(@Body() createHolderDto: CreateHolderDto) {
    return this.holdersService.create(createHolderDto);
  }

  @Get(':cpf')
  @ApiOperation({ summary: 'Find a holder by CPF' })
  @ApiResponse({ status: 200, description: 'The found holder record.'})
  @ApiResponse({ status: 404, description: 'Holder not found.'})
  async findOne(@Param('cpf') cpf: string) {
    const holder = await this.holdersService.findOne(cpf);
    if (!holder) {
      throw new NotFoundException('Portador não encontrado');
    }
    return holder;
  }

  @Delete(':cpf')
  @ApiOperation({ summary: 'Remove a holder by CPF' })
  @ApiResponse({ status: 200, description: 'The holder has been successfully removed.'})
  @ApiResponse({ status: 404, description: 'Holder not found.'})
  remove(@Param('cpf') cpf: string) {
    return this.holdersService.remove(cpf);
  }
}