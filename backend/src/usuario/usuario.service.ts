import { Injectable, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateUsuarioDto, UpdateUsuarioDto } from './dto/usuario.dto';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateUsuarioDto) {
    const existing = await this.prisma.usuario.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new ConflictException('El correo electrónico ya está en uso.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return this.prisma.usuario.create({
      data: {
        email: data.email,
        nombres: data.nombres,
        apellidos: data.apellidos,
        password: hashedPassword,
        fechaNacimiento: data.fechaNacimiento ? new Date(data.fechaNacimiento) : null,
        moneda: data.moneda,
      },
      select: { id: true, nombres: true, apellidos: true, email: true, moneda: true }
    });
  }

  async findAll(skip: number = 0, take: number = 10) {
    const [usuarios, total] = await Promise.all([
      this.prisma.usuario.findMany({
        where: { isDeleted: false },
        skip,
        take,
        select: { id: true, nombres: true, apellidos: true, email: true, moneda: true, createdAt: true }
      }),
      this.prisma.usuario.count({ where: { isDeleted: false } })
    ]);

    return { usuarios, total, skip, take };
  }

  async findOne(id: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id, isDeleted: false },
      select: { id: true, nombres: true, apellidos: true, email: true, fechaNacimiento: true, moneda: true, createdAt: true }
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return usuario;
  }

  async update(id: number, data: UpdateUsuarioDto) {
    await this.findOne(id); // Check existence

    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    if (data.fechaNacimiento) {
      updateData.fechaNacimiento = new Date(data.fechaNacimiento);
    }

    return this.prisma.usuario.update({
      where: { id },
      data: updateData,
      select: { id: true, nombres: true, apellidos: true, email: true }
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check existence

    const transaccionesCount = await this.prisma.transaccion.count({ where: { usuarioId: id } });
    if (transaccionesCount > 0) {
      throw new BadRequestException('No se puede eliminar el usuario porque tiene transacciones asociadas.');
    }

    // Soft delete
    return this.prisma.usuario.update({
      where: { id },
      data: { isDeleted: true },
      select: { id: true, nombres: true, email: true, isDeleted: true }
    });
  }
}
