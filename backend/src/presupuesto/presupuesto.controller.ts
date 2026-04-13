// [FILE] presupuesto.controller.ts
// REST endpoints for budget management (HU-05) and budget status dashboard (HU-06).

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
} from '@nestjs/common';
import { PresupuestoService } from './presupuesto.service';
import {
  CreatePresupuestoDto,
  UpdatePresupuestoDto,
} from './dto/presupuesto.dto';

@Controller('presupuestos')
export class PresupuestoController {
  constructor(private readonly presupuestoService: PresupuestoService) {}

  // POST /api/v1/presupuestos
  // Creates a budget. Body: { usuarioId, categoriaId, periodoId, montoLimite }
  @Post()
  create(@Body() createPresupuestoDto: CreatePresupuestoDto) {
    return this.presupuestoService.create(createPresupuestoDto);
  }

  // GET /api/v1/presupuestos/estado/:periodoId?usuarioId=1
  // [HU-06] Returns budget state with usage % and alert tiers for a full period.
  // Must be declared BEFORE :id route to prevent NestJS routing conflict.
  @Get('estado/:periodoId')
  getEstado(
    @Param('periodoId', ParseIntPipe) periodoId: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.presupuestoService.getEstadoPorPeriodo(periodoId, usuarioId);
  }

  // GET /api/v1/presupuestos?periodoId=1&usuarioId=1
  // [HU-05] Lists all budgets for a user in a given period.
  @Get()
  findAll(
    @Query('periodoId', ParseIntPipe) periodoId: number,
    @Query('usuarioId', ParseIntPipe) usuarioId: number,
  ) {
    return this.presupuestoService.findByPeriodo(periodoId, usuarioId);
  }

  // GET /api/v1/presupuestos/:id
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.presupuestoService.findOne(id);
  }

  // PATCH /api/v1/presupuestos/:id
  // Updates only montoLimite. Body: { montoLimite: number }
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePresupuestoDto: UpdatePresupuestoDto,
  ) {
    return this.presupuestoService.update(id, updatePresupuestoDto);
  }

  // DELETE /api/v1/presupuestos/:id
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.presupuestoService.remove(id);
  }
}
