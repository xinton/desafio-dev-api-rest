import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma.service';
import { CreateHolderDto } from './dto/create-holder.dto';
import { Holder, InvalidCpfError } from './holder.entity';
import { HolderProducerService } from './holder-producer-service';

@Injectable()
export class HoldersService {
  constructor(
    private prisma: PrismaService,
    private readonly holderProducerService: HolderProducerService,
  ) {}

  private async findHolderByCpf(cpf: string): Promise<Holder | null> {
    const holderFromDb = await this.prisma.holder.findUnique({
      where: { cpf },
    });

    return holderFromDb ? Holder.reconstitute(holderFromDb) : null;
  }

  async create(createHolderDto: CreateHolderDto): Promise<Holder> {
    let holder: Holder;
    try {
      holder = Holder.create(createHolderDto);
    } catch (error) {
      if (error instanceof InvalidCpfError) {
        throw new ConflictException(error.message);
      }
      throw error;
    }

    const existingHolder = await this.findHolderByCpf(holder.cpf);

    if (existingHolder) {
      throw new ConflictException('CPF já cadastrado');
    }

    const createdHolderData = await this.prisma.holder.create({
      data: {
        name: holder.name,
        cpf: holder.cpf,
      },
    });

    await this.holderProducerService.publishHolderCreated(createdHolderData);

    return Holder.reconstitute(createdHolderData);
  }

  async remove(cpf: string): Promise<Holder> {
    const holder = await this.findHolderByCpf(cpf);

    if (!holder) {
      throw new NotFoundException('Portador não encontrado');
    }

    const deletedHolderData = await this.prisma.holder.delete({
      where: { cpf },
    });

    return Holder.reconstitute(deletedHolderData);
  }

  async findOne(cpf: string): Promise<Holder | null> {
    return this.findHolderByCpf(cpf);
  }
}