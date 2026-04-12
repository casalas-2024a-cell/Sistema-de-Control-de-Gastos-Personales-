import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TipoTransaccionService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.tipoTransaccion.findMany();
  }
}
