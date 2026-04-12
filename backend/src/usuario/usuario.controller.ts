import { Controller, Get, Post, Body } from '@nestjs/common';
import { UsuarioService } from './usuario.service';

@Controller('usuarios')
export class UsuarioController {
  constructor(private readonly usuarioService: UsuarioService) {}

  @Post('register')
  create(@Body() createUsuarioDto: any) {
    return this.usuarioService.register(createUsuarioDto);
  }

  @Get()
  findAll() {
    return this.usuarioService.findAll();
  }
}
