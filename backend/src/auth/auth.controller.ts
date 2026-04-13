// [FILE] auth/auth.controller.ts
// Exposes authentication endpoints under /api/v1/auth.
// The login endpoint is PUBLIC (no guard). The profile endpoint is PROTECTED.

import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/v1/auth/login
  // PUBLIC — No guard. Validates credentials and returns a JWT accessToken.
  // Body: { email: string, password: string }
  // Response: { accessToken: string, usuario: { id, nombres, email, moneda } }
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // GET /api/v1/auth/perfil
  // PROTECTED — Requires valid JWT Bearer token.
  // Returns the authenticated user's profile data.
  // req.user is populated by JwtStrategy.validate() after guard passes.
  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  getPerfil(@Req() req: Request) {
    const user = req.user as { userId: number; email: string };
    return this.authService.getProfile(user.userId);
  }
}
