// [FILE] presupuesto.service.ts
// Implements HU-05 (budget CRUD with user/period ownership)
// and HU-06 (budget usage calculation with warning/exceeded thresholds).

import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreatePresupuestoDto,
  UpdatePresupuestoDto,
} from './dto/presupuesto.dto';

// [HU-06] Threshold constants — defined here to make them easy to adjust.
// Why constants: Avoids magic numbers scattered through the code.
const UMBRAL_ADVERTENCIA = 80; // Warn when spending reaches 80% of limit
const UMBRAL_EXCEDIDO = 100; // Alert as exceeded when over 100%

// [INTERFACE] EstadoPresupuesto
// Shape of each item returned by getEstadoPorPeriodo().
// Includes calculated fields: totalGastado, porcentajeUso, estadoAlerta.
export interface EstadoPresupuesto {
  id: number;
  categoria: { id: number; nombre: string; tipo: string; icono: string | null };
  montoLimite: number;
  totalGastado: number;
  porcentajeUso: number; // (totalGastado / montoLimite) * 100
  estadoAlerta: 'OK' | 'ADVERTENCIA' | 'EXCEDIDO'; // Visual indicator for frontend
}

@Injectable()
export class PresupuestoService {
  constructor(private prisma: PrismaService) {}

  // [HU-05 — CREATE] Creates a budget for a user+category+period combination.
  // Derives mes/anio from the Periodo record so the client doesn't need to send them.
  // This keeps the data consistent — one source of truth for date ranges.
  async create(data: CreatePresupuestoDto) {
    // 1. Validate category exists
    const categoria = await this.prisma.categoria.findUnique({
      where: { id: data.categoriaId },
    });
    if (!categoria) {
      throw new NotFoundException(
        `Categoría con ID ${data.categoriaId} no encontrada.`,
      );
    }

    // 2. Validate period exists — the budget must be anchored to a real period
    const periodo = await this.prisma.periodo.findUnique({
      where: { id: data.periodoId },
    });
    if (!periodo) {
      throw new NotFoundException(
        `Período con ID ${data.periodoId} no encontrado.`,
      );
    }

    // 3. Validate user owns the category (a user shouldn't budget someone else's category)
    if (categoria.usuarioId !== data.usuarioId) {
      throw new BadRequestException(
        'La categoría seleccionada no pertenece al usuario indicado.',
      );
    }

    // 4. Derive mes/anio from the period start date — consistency over client-supplied values
    const mes = periodo.fechaInicio.getMonth() + 1; // JS months are 0-indexed
    const anio = periodo.fechaInicio.getFullYear();

    // 5. Create, trapping duplicate constraint violation with friendly error message
    try {
      return await this.prisma.presupuesto.create({
        data: {
          usuarioId: data.usuarioId,
          categoriaId: data.categoriaId,
          periodoId: data.periodoId,
          montoLimite: data.montoLimite,
          mes,
          anio,
        },
        include: {
          categoria: { select: { nombre: true, tipo: true, icono: true } },
          periodo: { select: { nombre: true } },
        },
      });
    } catch (error: any) {
      // Prisma error P2002 = Unique constraint violated = duplicate budget
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Ya existe un presupuesto para la categoría "${categoria.nombre}" en el período "${periodo.nombre}".`,
        );
      }
      throw error;
    }
  }

  // [HU-05 — LIST BY PERIOD] Returns all budgets for a user in a specific period.
  // HU-06: Each item in the list should show usage — clients call getEstadoPorPeriodo() instead.
  findByPeriodo(periodoId: number, usuarioId: number) {
    return this.prisma.presupuesto.findMany({
      where: { periodoId, usuarioId },
      orderBy: { createdAt: 'desc' },
      include: {
        categoria: {
          select: { id: true, nombre: true, tipo: true, icono: true },
        },
        periodo: { select: { nombre: true } },
      },
    });
  }

  // [HU-05 — FIND ONE] Returns a single budget with its alert history.
  async findOne(id: number) {
    const presupuesto = await this.prisma.presupuesto.findUnique({
      where: { id },
      include: {
        categoria: { select: { nombre: true, tipo: true } },
        periodo: { select: { nombre: true } },
        alertas: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
    if (!presupuesto) {
      throw new NotFoundException(`Presupuesto con ID ${id} no encontrado.`);
    }
    return presupuesto;
  }

  // [HU-05 — UPDATE] Only the montoLimite can be changed post-creation.
  // Recalculating period/category would change the budget identity — delete+create instead.
  async update(id: number, data: UpdatePresupuestoDto) {
    await this.findOne(id);
    return this.prisma.presupuesto.update({
      where: { id },
      data: {
        ...(data.montoLimite !== undefined && {
          montoLimite: data.montoLimite,
        }),
      },
      include: {
        categoria: { select: { nombre: true } },
        periodo: { select: { nombre: true } },
      },
    });
  }

  // [HU-05 — DELETE] Removes a budget. Associated alerts are removed first.
  async remove(id: number) {
    await this.findOne(id);
    // Delete alerts first to satisfy FK constraint (Alerta.presupuestoId → Presupuesto.id)
    await this.prisma.alerta.deleteMany({ where: { presupuestoId: id } });
    return this.prisma.presupuesto.delete({ where: { id } });
  }

  // [HU-06 — CORE] Returns computed budget status for every budget in a period.
  // For each budget:
  //   1. Calculates totalGastado = SUM of EGRESO transactions for that category in that period
  //   2. Calculates porcentajeUso = (totalGastado / montoLimite) * 100
  //   3. Determines estadoAlerta: OK | ADVERTENCIA | EXCEDIDO
  // This is the primary endpoint for the dashboard progress-bar display.
  async getEstadoPorPeriodo(
    periodoId: number,
    usuarioId: number,
  ): Promise<EstadoPresupuesto[]> {
    // Fetch all budgets for this user+period, with their category data
    const presupuestos = await this.prisma.presupuesto.findMany({
      where: { periodoId, usuarioId },
      include: {
        categoria: {
          select: { id: true, nombre: true, tipo: true, icono: true },
        },
      },
    });

    // For each budget, calculate spending totals using Promise.all for performance
    // Why Promise.all: Runs all DB queries in parallel instead of sequentially
    const estados: EstadoPresupuesto[] = await Promise.all(
      presupuestos.map(async (p) => {
        // Sum all EGRESO transactions for this category within this period's date range
        const totalGastado = await this.calcularGastoMensual(
          p.categoriaId,
          p.mes,
          p.anio,
        );

        // Core formula from HU-06: (total_gastado / monto_límite) × 100
        const porcentajeUso =
          p.montoLimite > 0
            ? parseFloat(((totalGastado / p.montoLimite) * 100).toFixed(2))
            : 0;

        // Determine status tier for color-coded frontend display
        // Green < 80%, Yellow 80-100%, Red > 100%
        let estadoAlerta: 'OK' | 'ADVERTENCIA' | 'EXCEDIDO' = 'OK';
        if (porcentajeUso >= UMBRAL_EXCEDIDO) {
          estadoAlerta = 'EXCEDIDO';
        } else if (porcentajeUso >= UMBRAL_ADVERTENCIA) {
          estadoAlerta = 'ADVERTENCIA';
        }

        return {
          id: p.id,
          categoria: p.categoria,
          montoLimite: p.montoLimite,
          totalGastado,
          porcentajeUso,
          estadoAlerta,
        };
      }),
    );

    return estados;
  }

  // ─── INTERNAL UTILITIES (used by TransaccionService via injection) ───

  // Calculates total spending for a category in a given calendar month/year.
  // Called after each EGRESO transaction creation to check budget thresholds.
  async calcularGastoMensual(
    categoriaId: number,
    mes: number,
    anio: number,
  ): Promise<number> {
    const fechaInicio = new Date(anio, mes - 1, 1); // First day of month
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999); // Last moment of month

    const resultado = await this.prisma.transaccion.aggregate({
      where: {
        categoriaId,
        fecha: { gte: fechaInicio, lte: fechaFin },
      },
      _sum: { monto: true },
    });
    return resultado._sum.monto ?? 0;
  }

  // Finds a budget uniquely identified by user+category+period (new unique key).
  findPresupuestoPorCategoriaYPeriodo(
    categoriaId: number,
    periodoId: number,
    usuarioId: number,
  ) {
    return this.prisma.presupuesto.findUnique({
      where: {
        usuarioId_categoriaId_periodoId: { usuarioId, categoriaId, periodoId },
      },
    });
  }
}
