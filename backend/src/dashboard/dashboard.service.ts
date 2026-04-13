// [FILE] dashboard/dashboard.service.ts
//
// The analytics heart of Sprint 3. All methods execute optimized Prisma aggregation
// queries and return pre-computed data ready for the frontend dashboard to render.
//
// PERFORMANCE PHILOSOPHY:
//   - Use Prisma aggregate() + groupBy() instead of fetching all records and computing
//     in JavaScript. WHY: Aggregation runs in SQL (on the DB server), leveraging indexes
//     and set-based operations — orders of magnitude faster than JS-level looping.
//   - All queries are scoped by usuarioId so users never see each other's data.
//   - Date range filtering (fechaInicio/fechaFin) uses indexed fecha column for fast scans.

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeParams } from '../common/pipes/date-range.pipe';
import { PaginationParams } from '../common/pipes/pagination.pipe';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // ─── ENDPOINT 1: GET /dashboard/resumen-mensual (HU-07) ───────────────────────
  // Returns the monthly financial summary: total income, total expenses, and balance.
  //
  // QUERY DESIGN:
  //   We run TWO separate aggregate queries (not one joined query) because Prisma's
  //   aggregate() doesn't support conditional summing (SUM CASE WHEN ... END).
  //   Running them in parallel with Promise.all avoids sequential round-trips.
  //
  // PERFORMANCE:
  //   Both queries filter on { usuarioId, fecha } which benefits from a composite
  //   index on (usuarioId, fecha). See INDEX RECOMMENDATION below.
  async getResumenMensual(usuarioId: number, dateRange: DateRangeParams) {
    const { fechaInicio, fechaFin } = dateRange;

    // Base filter reused in both queries — avoids repetition and ensures consistency
    const baseWhere = {
      usuarioId,
      fecha: { gte: fechaInicio, lte: fechaFin },
    };

    // Run both aggregations in parallel — no dependency between them
    // WHY Promise.all: Cuts query time roughly in half vs sequential await
    const [resultIngresos, resultGastos] = await Promise.all([
      // Sum all transactions whose linked TipoTransaccion is "INGRESO"
      // WHY nested relation filter: We store tipoTransaccionId as FK, not the string "INGRESO"
      // So we join through the relation to filter by nombre = 'INGRESO'
      this.prisma.transaccion.aggregate({
        where: {
          ...baseWhere,
          tipoTransaccion: { nombre: 'INGRESO' },
        },
        _sum: { monto: true },
        _count: { id: true }, // Also return the count for display
      }),

      this.prisma.transaccion.aggregate({
        where: {
          ...baseWhere,
          tipoTransaccion: { nombre: 'EGRESO' },
        },
        _sum: { monto: true },
        _count: { id: true },
      }),
    ]);

    const totalIngresos = resultIngresos._sum.monto ?? 0;
    const totalGastos = resultGastos._sum.monto ?? 0;

    return {
      mes: dateRange.mes,
      anio: dateRange.anio,
      totalIngresos,
      totalGastos,
      // balance: positive = savings, negative = overspent
      balance: parseFloat((totalIngresos - totalGastos).toFixed(2)),
      cantidadIngresos: resultIngresos._count.id,
      cantidadGastos: resultGastos._count.id,
    };
  }

  // ─── ENDPOINT 2: GET /dashboard/gastos-por-categoria ─────────────────────────
  // Returns total spending broken down by category, ordered highest-first.
  //
  // QUERY DESIGN:
  //   Prisma's groupBy() maps to SQL GROUP BY — it lets the database group records
  //   by categoriaId and compute SUM(monto) per group in a single query.
  //
  //   WHY groupBy over manual aggregation:
  //   Alternative would be fetching all transactions and grouping in JS — O(n) memory.
  //   groupBy() does it in SQL with O(1) memory relative to result set size.
  //
  // PERFORMANCE NOTE:
  //   groupBy with _sum benefits from an index on (usuarioId, categoriaId, fecha).
  //   Without an index, the DB does a full table scan per group — acceptable at small scale,
  //   but adding that index is recommended for production with thousands of transactions.
  async getGastosPorCategoria(usuarioId: number, dateRange: DateRangeParams) {
    const { fechaInicio, fechaFin } = dateRange;

    // Step 1: Group EGRESO transactions by categoriaId, sum their monto
    const grupos = await this.prisma.transaccion.groupBy({
      by: ['categoriaId'],
      where: {
        usuarioId,
        fecha: { gte: fechaInicio, lte: fechaFin },
        tipoTransaccion: { nombre: 'EGRESO' }, // Only expenses go into this report
      },
      _sum: { monto: true },
      orderBy: { _sum: { monto: 'desc' } }, // Highest spender first for quick visual scanning
    });

    if (grupos.length === 0) return [];

    // Step 2: Fetch category names for all grouped IDs in one query
    // WHY separate query: Prisma groupBy() doesn't support include (relations).
    // We batch-fetch all needed categories to avoid N+1 queries.
    const categoriaIds = grupos.map(g => g.categoriaId);
    const categorias = await this.prisma.categoria.findMany({
      where: { id: { in: categoriaIds } },
      select: { id: true, nombre: true, icono: true },
    });

    // Step 3: Create a lookup map for O(1) category name resolution
    const catMap = new Map(categorias.map(c => [c.id, c]));

    // Step 4: Merge group data with category metadata
    return grupos.map(g => ({
      categoriaId: g.categoriaId,
      categoria: catMap.get(g.categoriaId)?.nombre ?? 'Sin categoría',
      icono: catMap.get(g.categoriaId)?.icono ?? null,
      total: parseFloat((g._sum.monto ?? 0).toFixed(2)),
    }));
  }

  // ─── ENDPOINT 3: GET /dashboard/presupuesto-vs-gasto ─────────────────────────
  // Returns each active budget alongside the actual spending and usage percentage.
  //
  // QUERY DESIGN:
  //   1. Fetch all budgets for the user in the target month/year (Presupuesto table).
  //   2. For each budget, aggregate total EGRESO spending in that category for the month.
  //   3. Join results in application layer (not SQL JOIN) because Prisma groupBy +
  //      conditional filtering across relations would require raw SQL.
  //   Running the spending aggregates in parallel via Promise.all keeps latency low.
  async getPresupuestoVsGasto(usuarioId: number, dateRange: DateRangeParams) {
    const { mes, anio, fechaInicio, fechaFin } = dateRange;

    // Fetch all budgets for this user in the specified month/year
    const presupuestos = await this.prisma.presupuesto.findMany({
      where: { usuarioId, mes, anio },
      include: {
        categoria: { select: { id: true, nombre: true, icono: true } },
      },
    });

    if (presupuestos.length === 0) return [];

    // For each budget, compute actual spending. Parallel to minimize total latency.
    const resultados = await Promise.all(
      presupuestos.map(async (p) => {
        const agg = await this.prisma.transaccion.aggregate({
          where: {
            usuarioId,
            categoriaId: p.categoriaId,
            fecha: { gte: fechaInicio, lte: fechaFin },
            tipoTransaccion: { nombre: 'EGRESO' },
          },
          _sum: { monto: true },
        });

        const gastado = agg._sum.monto ?? 0;
        // Core HU-06 formula — also used here for the report view
        const porcentaje = p.montoLimite > 0
          ? parseFloat(((gastado / p.montoLimite) * 100).toFixed(2))
          : 0;

        return {
          presupuestoId: p.id,
          categoria: p.categoria.nombre,
          icono: p.categoria.icono,
          presupuesto: p.montoLimite,
          gastado: parseFloat(gastado.toFixed(2)),
          porcentaje,
          // Color tier for frontend rendering
          estado: porcentaje >= 100 ? 'EXCEDIDO'
            : porcentaje >= 80 ? 'ADVERTENCIA'
            : 'OK',
        };
      }),
    );

    // Sort by percentage descending — most at-risk budgets appear first
    return resultados.sort((a, b) => b.porcentaje - a.porcentaje);
  }

  // ─── ENDPOINT 4: GET /dashboard/transacciones-recientes ──────────────────────
  // Returns the N most recent transactions for the user.
  // Uses PaginationPipe: skip and take passed from controller.
  //
  // PERFORMANCE:
  //   orderBy { fecha: 'desc' } benefits from an index on fecha.
  //   The take limit (default 10, max 100) prevents large result sets.
  async getTransaccionesRecientes(usuarioId: number, pagination: PaginationParams) {
    return this.prisma.transaccion.findMany({
      where: { usuarioId },
      orderBy: { fecha: 'desc' },
      skip: pagination.skip,
      take: pagination.take,
      include: {
        categoria: { select: { nombre: true, tipo: true, icono: true } },
        tipoTransaccion: { select: { nombre: true } },
        periodo: { select: { nombre: true } },
      },
    });
  }

  // ─── ENDPOINT 5: GET /dashboard/alertas-activas ───────────────────────────────
  // Returns recent budget alerts for the user — used in the notification center.
  async getAlertasActivas(usuarioId: number) {
    return this.prisma.alerta.findMany({
      where: { transaccion: { usuarioId } },
      orderBy: { createdAt: 'desc' },
      take: 20, // Cap at 20 most recent alerts
      include: {
        presupuesto: {
          include: {
            categoria: { select: { nombre: true, icono: true } },
          },
        },
      },
    });
  }
}
