import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuarioService {
  constructor(private prisma: PrismaService) {}

  async register(data: any) {
    const existing = await this.prisma.usuario.findUnique({ where: { email: data.email } });
    if (existing) throw new ConflictException('El correo ya está registrado');

    return this.prisma.usuario.create({
      data: {
        email: data.email,
        nombre: data.nombre,
        password: data.password,
      },
      select: { id: true, nombre: true, email: true }
    });
  }

  findAll() {
    return this.prisma.usuario.findMany({
      select: { id: true, nombre: true, email: true, createdAt: true }
    });
  }
}
