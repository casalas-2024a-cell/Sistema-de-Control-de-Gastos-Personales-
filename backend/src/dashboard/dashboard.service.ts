// [FILE] dashboard/dashboard.service.ts
//
// Analytics engine implementing HU-07 (Financial Summary).
// All queries use Prisma aggregate() and groupBy() for SQL-level performance.
//
// PERFORMANCE:
//   - Promise.all runs independent queries in parallel
//   - groupBy() delegates GROUP BY to PostgreSQL (not JS)
//   - All queries filtered by usuarioId (data isolation between users)

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DateRangeParams } from '../common/pipes/date-range.pipe';
import { PaginationParams } from '../common/pipes/pagination.pipe';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  // ─── HU-07 CORE: GET /dashboard/resumen/:periodoId ────────────────────────
  // Returns the FULL financial summary for a selected period:
  //   - Total ingresos, total egresos, balance neto
  //   - Desglose de gastos por categoría CON participación porcentual
  //   - Estado de cada presupuesto (OK / ADVERTENCIA / EXCEDIDO)
  //
  // HU-07 CRITERIA:
  //   ☑ Se puede consultar el resumen de un período seleccionado
  //   ☑ Incluye: total ingresos, total egresos, balance neto
  //   ☑ Desglose de gastos por categoría con participación porcentual
  //   ☑ Estado de cada presupuesto (cumplido, en alerta, excedido)
  //   ☑ Consultable para cualquier período histórico del usuario
  async getResumenPorPeriodo(usuarioId: number, periodoId: number) {
    // 1. Verify the period exists
    const periodo = await this.prisma.periodo.findUnique({
      where: { id: periodoId },
    });
    if (!periodo)
      throw new NotFoundException(`Período con ID ${periodoId} no encontrado.`);

    // Build date range from the period's actual start/end dates
    const fechaInicio = periodo.fechaInicio;
    const fechaFin = periodo.fechaFin;
    const baseWhere = { usuarioId, fecha: { gte: fechaInicio, lte: fechaFin } };

    // 2. Aggregate totals: ingresos + egresos in parallel
    const [resultIngresos, resultGastos] = await Promise.all([
      this.prisma.transaccion.aggregate({
        where: { ...baseWhere, tipoTransaccion: { nombre: 'INGRESO' } },
        _sum: { monto: true },
        _count: { id: true },
      }),
      this.prisma.transaccion.aggregate({
        where: { ...baseWhere, tipoTransaccion: { nombre: 'EGRESO' } },
        _sum: { monto: true },
        _count: { id: true },
      }),
    ]);

    const totalIngresos = resultIngresos._sum.monto ?? 0;
    const totalGastos = resultGastos._sum.monto ?? 0;
    const balance = parseFloat((totalIngresos - totalGastos).toFixed(2));

    // 3. Desglose por categoría CON participación porcentual
    //    HU-07: "desglose de gastos por categoría con su participación porcentual"
    const gruposCat = await this.prisma.transaccion.groupBy({
      by: ['categoriaId'],
      where: { ...baseWhere, tipoTransaccion: { nombre: 'EGRESO' } },
      _sum: { monto: true },
      orderBy: { _sum: { monto: 'desc' } },
    });

    // Fetch category names in one batch query (avoids N+1)
    const catIds = gruposCat.map((g) => g.categoriaId);
    const categorias =
      catIds.length > 0
        ? await this.prisma.categoria.findMany({
            where: { id: { in: catIds } },
            select: { id: true, nombre: true, icono: true },
          })
        : [];
    const catMap = new Map(categorias.map((c) => [c.id, c]));

    const desglosePorCategoria = gruposCat.map((g) => {
      const total = parseFloat((g._sum.monto ?? 0).toFixed(2));
      // Participación porcentual: qué fracción del gasto total representa esta categoría
      const participacion =
        totalGastos > 0
          ? parseFloat(((total / totalGastos) * 100).toFixed(2))
          : 0;
      return {
        categoriaId: g.categoriaId,
        categoria: catMap.get(g.categoriaId)?.nombre ?? 'Sin categoría',
        icono: catMap.get(g.categoriaId)?.icono ?? null,
        total,
        participacion, // e.g. 35.2 means this category is 35.2% of all spending
      };
    });

    // 4. Estado de presupuestos — with calculated spending and status tier
    //    HU-07: "estado de cada presupuesto (cumplido, en alerta, excedido)"
    const mes = fechaInicio.getMonth() + 1;
    const anio = fechaInicio.getFullYear();
    const presupuestos = await this.prisma.presupuesto.findMany({
      where: { usuarioId, periodoId },
      include: {
        categoria: { select: { id: true, nombre: true, icono: true } },
      },
    });

    const estadoPresupuestos = await Promise.all(
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
        const gastado = parseFloat((agg._sum.monto ?? 0).toFixed(2));
        const porcentaje =
          p.montoLimite > 0
            ? parseFloat(((gastado / p.montoLimite) * 100).toFixed(2))
            : 0;

        return {
          presupuestoId: p.id,
          categoria: p.categoria.nombre,
          icono: p.categoria.icono,
          montoLimite: p.montoLimite,
          gastado,
          porcentaje,
          // Estado with 3 possible values for visual indicators
          estado:
            porcentaje >= 100
              ? 'EXCEDIDO'
              : porcentaje >= 80
                ? 'ADVERTENCIA'
                : 'CUMPLIDO',
        };
      }),
    );

    // Return the complete financial summary for the period
    return {
      periodo: {
        id: periodo.id,
        nombre: periodo.nombre,
        fechaInicio,
        fechaFin,
      },
      totalIngresos,
      totalGastos,
      balance,
      cantidadIngresos: resultIngresos._count.id,
      cantidadGastos: resultGastos._count.id,
      desglosePorCategoria,
      estadoPresupuestos: estadoPresupuestos.sort(
        (a, b) => b.porcentaje - a.porcentaje,
      ),
    };
  }

  // ─── GET /dashboard/resumen-mensual?mes=M&anio=Y (legacy, still useful) ──
  async getResumenMensual(usuarioId: number, dateRange: DateRangeParams) {
    const { fechaInicio, fechaFin } = dateRange;
    const baseWhere = { usuarioId, fecha: { gte: fechaInicio, lte: fechaFin } };

    const [resultIngresos, resultGastos] = await Promise.all([
      this.prisma.transaccion.aggregate({
        where: { ...baseWhere, tipoTransaccion: { nombre: 'INGRESO' } },
        _sum: { monto: true },
        _count: { id: true },
      }),
      this.prisma.transaccion.aggregate({
        where: { ...baseWhere, tipoTransaccion: { nombre: 'EGRESO' } },
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
      balance: parseFloat((totalIngresos - totalGastos).toFixed(2)),
      cantidadIngresos: resultIngresos._count.id,
      cantidadGastos: resultGastos._count.id,
    };
  }

  // ─── GET /dashboard/gastos-por-categoria?mes=M&anio=Y ────────────────────
  async getGastosPorCategoria(usuarioId: number, dateRange: DateRangeParams) {
    const { fechaInicio, fechaFin } = dateRange;

    const grupos = await this.prisma.transaccion.groupBy({
      by: ['categoriaId'],
      where: {
        usuarioId,
        fecha: { gte: fechaInicio, lte: fechaFin },
        tipoTransaccion: { nombre: 'EGRESO' },
      },
      _sum: { monto: true },
      orderBy: { _sum: { monto: 'desc' } },
    });

    if (grupos.length === 0) return [];

    const categoriaIds = grupos.map((g) => g.categoriaId);
    const categorias = await this.prisma.categoria.findMany({
      where: { id: { in: categoriaIds } },
      select: { id: true, nombre: true, icono: true },
    });
    const catMap = new Map(categorias.map((c) => [c.id, c]));

    // Calculate total spending for participacion porcentual
    const totalGastos = grupos.reduce((sum, g) => sum + (g._sum.monto ?? 0), 0);

    return grupos.map((g) => {
      const total = parseFloat((g._sum.monto ?? 0).toFixed(2));
      return {
        categoriaId: g.categoriaId,
        categoria: catMap.get(g.categoriaId)?.nombre ?? 'Sin categoría',
        icono: catMap.get(g.categoriaId)?.icono ?? null,
        total,
        participacion:
          totalGastos > 0
            ? parseFloat(((total / totalGastos) * 100).toFixed(2))
            : 0,
      };
    });
  }

  // ─── GET /dashboard/presupuesto-vs-gasto?mes=M&anio=Y ────────────────────
  async getPresupuestoVsGasto(usuarioId: number, dateRange: DateRangeParams) {
    const { mes, anio, fechaInicio, fechaFin } = dateRange;

    const presupuestos = await this.prisma.presupuesto.findMany({
      where: { usuarioId, mes, anio },
      include: {
        categoria: { select: { id: true, nombre: true, icono: true } },
      },
    });

    if (presupuestos.length === 0) return [];

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
        const porcentaje =
          p.montoLimite > 0
            ? parseFloat(((gastado / p.montoLimite) * 100).toFixed(2))
            : 0;
        return {
          presupuestoId: p.id,
          categoria: p.categoria.nombre,
          icono: p.categoria.icono,
          presupuesto: p.montoLimite,
          gastado: parseFloat(gastado.toFixed(2)),
          porcentaje,
          estado:
            porcentaje >= 100
              ? 'EXCEDIDO'
              : porcentaje >= 80
                ? 'ADVERTENCIA'
                : 'CUMPLIDO',
        };
      }),
    );

    return resultados.sort((a, b) => b.porcentaje - a.porcentaje);
  }

  // ─── GET /dashboard/transacciones-recientes ───────────────────────────────
  async getTransaccionesRecientes(
    usuarioId: number,
    pagination: PaginationParams,
  ) {
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

  // ─── GET /dashboard/alertas-activas ────────────────────────────────────────
  async getAlertasActivas(usuarioId: number) {
    return this.prisma.alerta.findMany({
      where: { transaccion: { usuarioId } },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        presupuesto: {
          include: { categoria: { select: { nombre: true, icono: true } } },
        },
      },
    });
  }
}
