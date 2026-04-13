// [FILE] dashboard/dashboard.controller.ts
// Analytics endpoints — ALL protected with JwtAuthGuard.
// Now uses @CurrentUser() decorator (HU-09) instead of raw @Req().
//
// HU-07 NEW: GET /dashboard/resumen/:periodoId → full financial summary for any period.

import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  DateRangePipe,
  DateRangeParams,
} from '../common/pipes/date-range.pipe';
import {
  PaginationPipe,
  PaginationParams,
} from '../common/pipes/pagination.pipe';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // [HU-07 CORE] GET /api/v1/dashboard/resumen/:periodoId
  // Returns the COMPLETE financial summary for the given period:
  //   totalIngresos, totalGastos, balance, desglosePorCategoria[], estadoPresupuestos[]
  // This is the primary endpoint for the /resumen page.
  @Get('resumen/:periodoId')
  getResumenPorPeriodo(
    @CurrentUser('userId') userId: number,
    @Param('periodoId', ParseIntPipe) periodoId: number,
  ) {
    return this.dashboardService.getResumenPorPeriodo(userId, periodoId);
  }

  // GET /api/v1/dashboard/resumen-mensual?mes=4&anio=2026
  @Get('resumen-mensual')
  getResumenMensual(
    @CurrentUser('userId') userId: number,
    @Query(DateRangePipe) dateRange: DateRangeParams,
  ) {
    return this.dashboardService.getResumenMensual(userId, dateRange);
  }

  // GET /api/v1/dashboard/gastos-por-categoria?mes=4&anio=2026
  @Get('gastos-por-categoria')
  getGastosPorCategoria(
    @CurrentUser('userId') userId: number,
    @Query(DateRangePipe) dateRange: DateRangeParams,
  ) {
    return this.dashboardService.getGastosPorCategoria(userId, dateRange);
  }

  // GET /api/v1/dashboard/presupuesto-vs-gasto?mes=4&anio=2026
  @Get('presupuesto-vs-gasto')
  getPresupuestoVsGasto(
    @CurrentUser('userId') userId: number,
    @Query(DateRangePipe) dateRange: DateRangeParams,
  ) {
    return this.dashboardService.getPresupuestoVsGasto(userId, dateRange);
  }

  // GET /api/v1/dashboard/transacciones-recientes?skip=0&take=10
  @Get('transacciones-recientes')
  getTransaccionesRecientes(
    @CurrentUser('userId') userId: number,
    @Query(PaginationPipe) pagination: PaginationParams,
  ) {
    return this.dashboardService.getTransaccionesRecientes(userId, pagination);
  }

  // GET /api/v1/dashboard/alertas-activas
  @Get('alertas-activas')
  getAlertasActivas(@CurrentUser('userId') userId: number) {
    return this.dashboardService.getAlertasActivas(userId);
  }
}
