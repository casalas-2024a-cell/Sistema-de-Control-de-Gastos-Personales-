// [FILE] presupuesto.controller.ts
// Exposes REST endpoints for budget management under /api/v1/presupuestos.
// Each method delegates business logic to PresupuestoService — thin controller pattern.

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { PresupuestoService } from './presupuesto.service';
import { CreatePresupuestoDto, UpdatePresupuestoDto } from './dto/presupuesto.dto';

@Controller('presupuestos')
export class PresupuestoController {
  constructor(private readonly presupuestoService: PresupuestoService) {}

  // POST /api/v1/presupuestos
  // Creates a new budget for a category in a given month/year.
  // Body: { categoriaId, montoLimite, mes, anio }
  @Post()
  create(@Body() createPresupuestoDto: CreatePresupuestoDto) {
    return this.presupuestoService.create(createPresupuestoDto);
  }

  // GET /api/v1/presupuestos
  // Lists all budgets, newest first. Includes category name for display.
  @Get()
  findAll() {
    return this.presupuestoService.findAll();
  }

  // GET /api/v1/presupuestos/:id
  // Returns a single budget with its alerts history.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.presupuestoService.findOne(id);
  }

  // PATCH /api/v1/presupuestos/:id
  // Partially updates a budget. Uses PATCH (not PUT) because full replacement is not needed.
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePresupuestoDto: UpdatePresupuestoDto,
  ) {
    return this.presupuestoService.update(id, updatePresupuestoDto);
  }

  // DELETE /api/v1/presupuestos/:id
  // Permanently deletes a budget. Related alerts are also removed.
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.presupuestoService.remove(id);
  }
}
