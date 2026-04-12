import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PeriodoService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.periodo.create({
      data: {
        ...data,
        fechaInicio: new Date(data.fechaInicio),
        fechaFin: new Date(data.fechaFin),
      }
    });
  }

  findActivos() {
    return this.prisma.periodo.findMany({ where: { estado: 'ACTIVO' } });
  }
}
