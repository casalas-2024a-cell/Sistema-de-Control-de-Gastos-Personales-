// [FILE] dashboard/dashboard.controller.ts
// Exposes analytics endpoints under /api/v1/dashboard (HU-07).
// ALL routes are protected with @UseGuards(JwtAuthGuard) — only authenticated users access them.
//
// DESIGN: The controller is intentionally thin — it only:
//   1. Enforces authentication (guard)
//   2. Extracts and transforms query params (via pipes)
//   3. Reads the authenticated user's ID from req.user (injected by JwtStrategy)
//   4. Delegates computation to DashboardService

import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { DateRangePipe, DateRangeParams } from '../common/pipes/date-range.pipe';
import { PaginationPipe, PaginationParams } from '../common/pipes/pagination.pipe';

@Controller('dashboard')
@UseGuards(JwtAuthGuard) // Applies to ALL routes in this controller — one decorator, total protection
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // GET /api/v1/dashboard/resumen-mensual?mes=4&anio=2026
  // Returns: { totalIngresos, totalGastos, balance, cantidadIngresos, cantidadGastos }
  // The DateRangePipe validates the query params and computes fechaInicio/fechaFin.
  @Get('resumen-mensual')
  getResumenMensual(
    @Req() req: Request,
    @Query(DateRangePipe) dateRange: DateRangeParams,
  ) {
    const { userId } = req.user as { userId: number };
    return this.dashboardService.getResumenMensual(userId, dateRange);
  }

  // GET /api/v1/dashboard/gastos-por-categoria?mes=4&anio=2026
  // Returns: [{ categoria, icono, total }] sorted by total descending
  @Get('gastos-por-categoria')
  getGastosPorCategoria(
    @Req() req: Request,
    @Query(DateRangePipe) dateRange: DateRangeParams,
  ) {
    const { userId } = req.user as { userId: number };
    return this.dashboardService.getGastosPorCategoria(userId, dateRange);
  }

  // GET /api/v1/dashboard/presupuesto-vs-gasto?mes=4&anio=2026
  // Returns: [{ categoria, presupuesto, gastado, porcentaje, estado }] sorted by % desc
  @Get('presupuesto-vs-gasto')
  getPresupuestoVsGasto(
    @Req() req: Request,
    @Query(DateRangePipe) dateRange: DateRangeParams,
  ) {
    const { userId } = req.user as { userId: number };
    return this.dashboardService.getPresupuestoVsGasto(userId, dateRange);
  }

  // GET /api/v1/dashboard/transacciones-recientes?skip=0&take=10
  // Returns last N transactions ordered by date descending.
  // The PaginationPipe enforces skip >= 0 and 1 <= take <= 100.
  @Get('transacciones-recientes')
  getTransaccionesRecientes(
    @Req() req: Request,
    @Query(PaginationPipe) pagination: PaginationParams,
  ) {
    const { userId } = req.user as { userId: number };
    return this.dashboardService.getTransaccionesRecientes(userId, pagination);
  }

  // GET /api/v1/dashboard/alertas-activas
  // Returns the 20 most recent budget alerts for the user.
  @Get('alertas-activas')
  getAlertasActivas(@Req() req: Request) {
    const { userId } = req.user as { userId: number };
    return this.dashboardService.getAlertasActivas(userId);
  }
}
