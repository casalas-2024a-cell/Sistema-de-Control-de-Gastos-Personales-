// [FILE] auth/auth.controller.ts
// Authentication endpoints: login (public), register (public), profile (protected).
//
// HU-09: Uses @CurrentUser() decorator instead of raw req.user access.

import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /api/v1/auth/login — PUBLIC
  // Body: { email, password }
  // Returns: { accessToken, usuario }
  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  // POST /api/v1/auth/register — PUBLIC
  // Body: { nombres, apellidos, email, password, fechaNacimiento?, moneda? }
  // Returns: { accessToken, usuario }
  // WHY: Allows self-registration from the login page without admin intervention.
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  // GET /api/v1/auth/perfil — PROTECTED
  // Returns the authenticated user's profile data.
  // Uses @CurrentUser('userId') instead of raw @Req() for cleaner code.
  @UseGuards(JwtAuthGuard)
  @Get('perfil')
  getPerfil(@CurrentUser('userId') userId: number) {
    return this.authService.getProfile(userId);
  }
}
