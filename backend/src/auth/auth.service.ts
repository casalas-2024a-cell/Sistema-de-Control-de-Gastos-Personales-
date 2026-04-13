// [FILE] auth/auth.service.ts
// Handles login, registration, and profile retrieval.
//
// HU-09 CRITERIA:
//   ☑ Login with email+password → returns JWT
//   ☑ JWT has configurable expiry (24h via JwtModule)
//   ☑ Registration creates a new user and returns a token immediately
//   ☑ Protected endpoints reject without valid token (enforced by JwtAuthGuard)

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // [LOGIN] Validates credentials and returns a signed JWT.
  // Security: bcrypt.compare is timing-safe; generic error messages prevent enumeration.
  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { email: dto.email, isDeleted: false },
    });

    if (!usuario) {
      throw new UnauthorizedException(
        'Credenciales incorrectas. Verifica tu correo y contraseña.',
      );
    }

    const passwordValid = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValid) {
      throw new UnauthorizedException(
        'Credenciales incorrectas. Verifica tu correo y contraseña.',
      );
    }

    // Build and sign the JWT. 'sub' is the standard claim for user identity.
    const accessToken = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
    });

    return {
      accessToken,
      usuario: {
        id: usuario.id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        moneda: usuario.moneda,
      },
    };
  }

  // [REGISTER] Creates a new user and immediately returns a valid JWT.
  // WHY return token on register: Saves the user from having to login right after signing up.
  async register(dto: RegisterDto) {
    // Check for duplicate email
    const existing = await this.prisma.usuario.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('El correo electrónico ya está registrado.');
    }

    // Hash password with bcrypt (salt rounds = 10)
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        email: dto.email,
        nombres: dto.nombres,
        apellidos: dto.apellidos,
        password: hashedPassword,
        fechaNacimiento: dto.fechaNacimiento
          ? new Date(dto.fechaNacimiento)
          : null,
        moneda: dto.moneda || 'COP',
      },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        moneda: true,
      },
    });

    // Sign a JWT for the newly created user
    const accessToken = this.jwtService.sign({
      sub: usuario.id,
      email: usuario.email,
    });

    return {
      accessToken,
      usuario,
    };
  }

  // [PROFILE] Returns full user data for the sidebar/profile page.
  async getProfile(userId: number) {
    return this.prisma.usuario.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nombres: true,
        apellidos: true,
        email: true,
        moneda: true,
        createdAt: true,
      },
    });
  }
}
