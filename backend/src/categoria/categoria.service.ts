import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoriaService {
  constructor(private prisma: PrismaService) {}

  create(data: any) {
    return this.prisma.categoria.create({ data });
  }

  findAllByUser(usuarioId: number) {
    return this.prisma.categoria.findMany({ where: { usuarioId } });
  }
}
