import { Test, TestingModule } from '@nestjs/testing';
import { HoldersService } from './holders.service';
import { PrismaService } from '../../infrastructure/prisma.service';
import { HolderProducerService } from './holder-producer-service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateHolderDto } from './dto/create-holder.dto';
import { Holder } from '@prisma/client';
import * as cpfValidator from 'gerador-validador-cpf';

// Mock the cpf validator
jest.mock('gerador-validador-cpf', () => ({
  validate: jest.fn(),
}));

const mockCpf = '12345678900';
const mockHolder: Holder = {
  id: 'some-holder-id',
  name: 'John Doe',
  cpf: mockCpf,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const createHolderDto: CreateHolderDto = {
  name: 'John Doe',
  cpf: mockCpf,
};

describe('HoldersService', () => {
  let service: HoldersService;
  let prisma: PrismaService;
  let holderProducerService: HolderProducerService;

  const mockPrismaService = {
    holder: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockHolderProducerService = {
    publishHolderCreated: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HoldersService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: HolderProducerService,
          useValue: mockHolderProducerService,
        },
      ],
    }).compile();

    service = module.get<HoldersService>(HoldersService);
    prisma = module.get<PrismaService>(PrismaService);
    holderProducerService = module.get<HolderProducerService>(
      HolderProducerService,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new holder successfully', async () => {
      (cpfValidator.validate as jest.Mock).mockReturnValue(true);
      mockPrismaService.holder.findUnique.mockResolvedValue(null);
      mockPrismaService.holder.create.mockResolvedValue(mockHolder);
      mockHolderProducerService.publishHolderCreated.mockResolvedValue(
        undefined,
      );

      const result = await service.create(createHolderDto);

      expect(result).toEqual(mockHolder);
      expect(cpfValidator.validate).toHaveBeenCalledWith(createHolderDto.cpf);
      expect(prisma.holder.findUnique).toHaveBeenCalledWith({
        where: { cpf: createHolderDto.cpf },
      });
      expect(prisma.holder.create).toHaveBeenCalledWith({
        data: createHolderDto,
      });
      expect(
        holderProducerService.publishHolderCreated,
      ).toHaveBeenCalledWith(mockHolder);
    });

    it('should throw ConflictException for an invalid CPF', async () => {
      (cpfValidator.validate as jest.Mock).mockReturnValue(false);

      await expect(service.create(createHolderDto)).rejects.toThrow(
        new ConflictException('CPF inválido'),
      );
    });

    it('should throw ConflictException if CPF is already registered', async () => {
      (cpfValidator.validate as jest.Mock).mockReturnValue(true);
      mockPrismaService.holder.findUnique.mockResolvedValue(mockHolder);

      await expect(service.create(createHolderDto)).rejects.toThrow(
        new ConflictException('CPF já cadastrado'),
      );
    });
  });

  describe('remove', () => {
    it('should remove a holder successfully', async () => {
      mockPrismaService.holder.findUnique.mockResolvedValue(mockHolder);
      mockPrismaService.holder.delete.mockResolvedValue(mockHolder);

      const result = await service.remove(mockCpf);

      expect(result).toEqual(mockHolder);
      expect(prisma.holder.findUnique).toHaveBeenCalledWith({
        where: { cpf: mockCpf },
      });
      expect(prisma.holder.delete).toHaveBeenCalledWith({
        where: { cpf: mockCpf },
      });
    });

    it('should throw NotFoundException if holder does not exist', async () => {
      mockPrismaService.holder.findUnique.mockResolvedValue(null);

      await expect(service.remove(mockCpf)).rejects.toThrow(
        new NotFoundException('Portador não encontrado'),
      );
    });
  });

  describe('findOne', () => {
    it('should return a holder if found', async () => {
      mockPrismaService.holder.findUnique.mockResolvedValue(mockHolder);

      const result = await service.findOne(mockCpf);

      expect(result).toEqual(mockHolder);
      expect(prisma.holder.findUnique).toHaveBeenCalledWith({
        where: { cpf: mockCpf },
      });
    });

    it('should return null if holder is not found', async () => {
      mockPrismaService.holder.findUnique.mockResolvedValue(null);

      const result = await service.findOne(mockCpf);

      expect(result).toBeNull();
    });
  });
});