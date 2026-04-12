import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransaccionService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.transaccion.create({ 
      data: {
        monto: data.monto,
        descripcion: data.descripcion,
        fecha: new Date(data.fecha),
        usuarioId: data.usuarioId,
        categoriaId: data.categoriaId,
        tipoTransaccionId: data.tipoTransaccionId,
        periodoId: data.periodoId
      }
    });
  }

  findByPeriodAndUser(periodoId: number, usuarioId: number) {
    return this.prisma.transaccion.findMany({
      where: { periodoId, usuarioId },
      include: {
        categoria: true,
        tipoTransaccion: true
      }
    });
  }
}
