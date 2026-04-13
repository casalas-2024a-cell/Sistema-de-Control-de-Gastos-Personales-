// [FILE] auth/auth.service.ts
// Handles user authentication logic: credential validation and JWT token generation.
//
// FLOW:
//   1. Client sends POST /auth/login with { email, password }
//   2. AuthService.login() finds the user by email
//   3. Compares the sent password against the bcrypt hash stored in DB
//   4. If valid, signs a JWT containing { sub: userId, email } and returns it
//   5. Client stores the token and sends it as "Authorization: Bearer <token>" on future requests
//
// SECURITY NOTES:
//   - We compare hashed passwords with bcrypt.compare (never store or compare plain text)
//   - We use a short expiry (1d) so compromised tokens expire quickly
//   - The JWT secret is read from the environment, never hardcoded

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // [LOGIN] Validates credentials and returns a signed JWT.
  // Returns: { accessToken: string, usuario: { id, nombres, email } }
  async login(dto: LoginDto) {
    // 1. Find user by email. We include password here (normally excluded in other queries).
    // WHY findFirst instead of findUnique: allows us to also check isDeleted = false
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        email: dto.email,
        isDeleted: false, // Soft-deleted users cannot log in
      },
    });

    // 2. If user doesn't exist, throw generic error.
    // WHY generic: Don't reveal whether the email exists — prevents user enumeration attacks.
    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas. Verifica tu correo y contraseña.');
    }

    // 3. Compare provided password against the bcrypt hash stored in DB.
    // bcrypt.compare is timing-safe — resistant to timing-based side-channel attacks.
    const passwordValid = await bcrypt.compare(dto.password, usuario.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Credenciales incorrectas. Verifica tu correo y contraseña.');
    }

    // 4. Build the JWT payload.
    // WHY minimal payload: Tokens are sent on every request; keep them small.
    // 'sub' (subject) is the standard JWT claim for the user identifier.
    const payload = {
      sub: usuario.id,
      email: usuario.email,
    };

    // 5. Sign the token. JwtService reads secret + options from JwtModule.register() config.
    const accessToken = this.jwtService.sign(payload);

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

  // [PROFILE] Returns the authenticated user's data from DB (used via req.user in controllers).
  // This is called after the JWT guard has already validated the token.
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
