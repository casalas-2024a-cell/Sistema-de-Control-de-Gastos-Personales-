// [FILE] transaccion.controller.ts
// Exposes REST endpoints for transaction management under /api/v1/transacciones.
// Also exposes the alerts endpoint under /api/v1/transacciones/alertas/:usuarioId

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { TransaccionService } from './transaccion.service';
import { CreateTransaccionDto, UpdateTransaccionDto } from './dto/transaccion.dto';

@Controller('transacciones')
export class TransaccionController {
  constructor(private readonly transaccionService: TransaccionService) {}

  // POST /api/v1/transacciones
  // Creates a transaction and returns it alongside any budget alert if exceeded.
  // Response shape: { success: true, data: { transaccion, alerta } }
  // The `alerta` field is null if no budget was exceeded.
  @Post()
  create(@Body() createTransaccionDto: CreateTransaccionDto) {
    return this.transaccionService.create(createTransaccionDto);
  }

  // GET /api/v1/transacciones?periodoId=1&usuarioId=2
  // Lists all transactions for a user in a given period.
  @Get()
  findAll(
    @Query('periodoId', ParseIntPipe) periodoId: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.transaccionService.findByPeriodAndUser(periodoId, usuarioId);
  }

  // GET /api/v1/transacciones/alertas/:usuarioId
  // Returns all budget-exceeded alerts for a user (notification history).
  // Why separate endpoint: Alerts are a distinct view from transactions.
  // NOTE: this route must be declared BEFORE :id to prevent routing conflict
  @Get('alertas/:usuarioId')
  findAlertas(@Param('usuarioId', ParseIntPipe) usuarioId: number) {
    return this.transaccionService.findAlertasByUser(usuarioId);
  }

  // GET /api/v1/transacciones/:id
  // Returns a single transaction with its data and optional alert.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.transaccionService.findOne(id);
  }

  // PATCH /api/v1/transacciones/:id
  // Partially updates a transaction (amount, description, date, etc.).
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTransaccionDto: UpdateTransaccionDto,
  ) {
    return this.transaccionService.update(id, updateTransaccionDto);
  }

  // DELETE /api/v1/transacciones/:id
  // Removes a transaction and its associated alert record.
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transaccionService.remove(id);
  }
}
