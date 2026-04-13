import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePeriodoDto, UpdatePeriodoDto } from './dto/periodo.dto';

@Injectable()
export class PeriodoService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreatePeriodoDto) {
    const fInicio = new Date(data.fechaInicio);
    const fFin = new Date(data.fechaFin);

    if (fFin <= fInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio.',
      );
    }

    const existingNombre = await this.prisma.periodo.findUnique({
      where: { nombre: data.nombre },
    });
    if (existingNombre) {
      throw new ConflictException('Ya existe un período con este nombre.');
    }

    const estado = data.estado || 'ACTIVO';
    if (estado === 'ACTIVO') {
      const activePeriod = await this.prisma.periodo.findFirst({
        where: { estado: 'ACTIVO' },
      });
      if (activePeriod) {
        throw new ConflictException(
          'Ya existe un período activo. Solo puede haber uno a la vez.',
        );
      }
    }

    return this.prisma.periodo.create({
      data: {
        nombre: data.nombre,
        fechaInicio: fInicio,
        fechaFin: fFin,
        estado: estado,
      },
    });
  }

  async findAll() {
    return this.prisma.periodo.findMany({
      orderBy: { fechaInicio: 'desc' },
    });
  }

  async update(id: number, data: UpdatePeriodoDto) {
    const periodo = await this.prisma.periodo.findUnique({ where: { id } });
    if (!periodo) throw new NotFoundException('Período no encontrado');

    const fInicio = data.fechaInicio
      ? new Date(data.fechaInicio)
      : periodo.fechaInicio;
    const fFin = data.fechaFin ? new Date(data.fechaFin) : periodo.fechaFin;

    if (fFin <= fInicio) {
      throw new BadRequestException(
        'La fecha de fin debe ser posterior a la fecha de inicio.',
      );
    }

    if (data.nombre && data.nombre !== periodo.nombre) {
      const existing = await this.prisma.periodo.findUnique({
        where: { nombre: data.nombre },
      });
      if (existing) {
        throw new ConflictException('Ya existe un período con este nombre.');
      }
    }

    if (data.estado === 'ACTIVO' && periodo.estado !== 'ACTIVO') {
      const activePeriod = await this.prisma.periodo.findFirst({
        where: { estado: 'ACTIVO' },
      });
      if (activePeriod && activePeriod.id !== id) {
        throw new ConflictException(
          'Ya existe un período activo. Solo puede haber uno a la vez.',
        );
      }
    }

    return this.prisma.periodo.update({
      where: { id },
      data: {
        nombre: data.nombre,
        fechaInicio: data.fechaInicio ? fInicio : undefined,
        fechaFin: data.fechaFin ? fFin : undefined,
        estado: data.estado,
      },
    });
  }
}
