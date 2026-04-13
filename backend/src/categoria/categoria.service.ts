import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoriaDto, UpdateCategoriaDto } from './dto/categoria.dto';

@Injectable()
export class CategoriaService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateCategoriaDto) {
    const existing = await this.prisma.categoria.findUnique({
      where: {
        usuarioId_nombre: {
          usuarioId: data.usuarioId,
          nombre: data.nombre,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Ya tienes una categoría con este nombre.');
    }

    return this.prisma.categoria.create({ data });
  }

  async findAllByUser(usuarioId: number) {
    return this.prisma.categoria.findMany({
      where: { usuarioId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: number, data: UpdateCategoriaDto) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');

    if (data.nombre && data.nombre !== categoria.nombre) {
      const existing = await this.prisma.categoria.findUnique({
        where: {
          usuarioId_nombre: {
            usuarioId: categoria.usuarioId,
            nombre: data.nombre,
          },
        },
      });
      if (existing) {
        throw new ConflictException('Ya tienes una categoría con este nombre.');
      }
    }

    return this.prisma.categoria.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const categoria = await this.prisma.categoria.findUnique({ where: { id } });
    if (!categoria) throw new NotFoundException('Categoría no encontrada');

    const transaccionesCount = await this.prisma.transaccion.count({
      where: { categoriaId: id },
    });

    if (transaccionesCount > 0) {
      throw new BadRequestException(
        'No se puede eliminar la categoría porque tiene transacciones asociadas.',
      );
    }

    return this.prisma.categoria.delete({ where: { id } });
  }
}
