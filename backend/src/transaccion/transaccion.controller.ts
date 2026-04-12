// [FILE] transaccion.controller.ts
// Exposes full CRUD for transactions (HU-04) and alerts endpoint (HU-06).

import {
  Controller, Get, Post, Patch, Delete,
  Body, Param, Query, ParseIntPipe,
} from '@nestjs/common';
import { TransaccionService } from './transaccion.service';
import { CreateTransaccionDto, UpdateTransaccionDto } from './dto/transaccion.dto';

@Controller('transacciones')
export class TransaccionController {
  constructor(private readonly transaccionService: TransaccionService) {}

  // POST /api/v1/transacciones
  // Creates a transaction. On success returns { transaccion, alerta }.
  // alerta is null if no budget threshold was crossed.
  @Post()
  create(@Body() dto: CreateTransaccionDto) {
    return this.transaccionService.create(dto);
  }

  // GET /api/v1/transacciones?periodoId=1&usuarioId=1&categoriaId=2 (categoriaId optional)
  // [HU-04] List with mandatory period filter + optional category filter.
  @Get()
  findAll(
    @Query('periodoId', ParseIntPipe) periodoId: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
    @Query('categoriaId') categoriaId?: string,
  ) {
    return this.transaccionService.findAll(
      periodoId,
      usuarioId,
      categoriaId ? parseInt(categoriaId) : undefined,
    );
  }

  // GET /api/v1/transacciones/alertas/:usuarioId
  // [HU-06] Returns all budget alerts for a user (notification history).
  // Declared BEFORE :id to avoid routing ambiguity.
  @Get('alertas/:usuarioId')
  findAlertas(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.transaccionService.findAlertasByUser(usuarioId);
  }

  // GET /api/v1/transacciones/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transaccionService.findOne(id);
  }

  // PATCH /api/v1/transacciones/:id
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTransaccionDto) {
    return this.transaccionService.update(id, dto);
  }

  // DELETE /api/v1/transacciones/:id
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transaccionService.remove(id);
  }
}
