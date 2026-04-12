import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CategoriaService } from './categoria.service';

@Controller('categorias')
export class CategoriaController {
  constructor(private readonly categoriaService: CategoriaService) {}

  @Post()
  create(@Body() createCategoriaDto: any) {
    return this.categoriaService.create(createCategoriaDto);
  }

  @Get('usuario/:usuarioId')
  findAllByUser(@Param('usuarioId') usuarioId: string) {
    return this.categoriaService.findAllByUser(+usuarioId);
  }
}
