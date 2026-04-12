// [FILE] transaccion.service.ts
// Core transaction business logic for HU-04 (CRUD), HU-05 (budget check), and HU-06 (alerts).
//
// ARCHITECTURE NOTE:
// This service intentionally imports PresupuestoService to avoid duplicating the
// budget calculation logic. This is NestJS dependency injection — PresupuestoModule
// exports PresupuestoService, which is then imported in TransaccionModule.

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PresupuestoService } from '../presupuesto/presupuesto.service';
import { CreateTransaccionDto, UpdateTransaccionDto } from './dto/transaccion.dto';

// [INTERFACE] AlertaResult
// Defines the shape of the alert object returned inline with the create response.
// Why an interface: Provides type safety without creating a separate DB entity for inline alerts.
export interface AlertaResponse {
  superado: boolean;       // true if the budget was exceeded
  mensaje: string;         // Human-readable message for the frontend
  montoGastado: number;    // Total spent this month in the category (after this transaction)
  montoLimite: number;     // The budget limit that was exceeded
}

@Injectable()
export class TransaccionService {
  // Why inject PresupuestoService here?
  // TransaccionService needs to query budget data to implement HU-06.
  // Instead of duplicating Prisma queries, we reuse PresupuestoService's
  // calcularGastoMensual() and findPresupuestoPorCategoriaMesAnio() methods.
  constructor(
    private prisma: PrismaService,
    private presupuestoService: PresupuestoService,
  ) {}

  // [HU-04] CREATE: Registers a new financial transaction.
  // [HU-05/06] After creating, triggers budget check and returns inline alert if exceeded.
  // Returns: { transaccion, alerta? } — the transaccion is always included; alerta is conditional.
  async create(data: CreateTransaccionDto): Promise<{ transaccion: any; alerta: AlertaResponse | null }> {

    // --- STEP A: Validate related entities exist ---
    // Why: Prisma will throw a cryptic internal error if FK relations don't exist.
    // Better to throw a clear 404 before insert.

    const categoria = await this.prisma.categoria.findUnique({
      where: { id: data.categoriaId },
    });
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${data.categoriaId} no encontrada.`);
    }

    const tipoTransaccion = await this.prisma.tipoTransaccion.findUnique({
      where: { id: data.tipoTransaccionId },
    });
    if (!tipoTransaccion) {
      throw new NotFoundException(`TipoTransaccion con ID ${data.tipoTransaccionId} no encontrado.`);
    }

    const periodo = await this.prisma.periodo.findUnique({
      where: { id: data.periodoId },
    });
    if (!periodo) {
      throw new NotFoundException(`Período con ID ${data.periodoId} no encontrado.`);
    }

    const fechaTransaccion = new Date(data.fecha);

    // --- STEP B: Persist the transaction ---
    const transaccion = await this.prisma.transaccion.create({
      data: {
        monto: data.monto,
        descripcion: data.descripcion,
        fecha: fechaTransaccion,
        usuarioId: data.usuarioId,
        categoriaId: data.categoriaId,
        tipoTransaccionId: data.tipoTransaccionId,
        periodoId: data.periodoId,
      },
      include: {
        categoria: { select: { nombre: true, tipo: true } },
        tipoTransaccion: { select: { nombre: true } },
        periodo: { select: { nombre: true } },
      },
    });

    // --- STEP C: Budget Alert Check (HU-06) ---
    // Only check budgets for EGRESO transactions (spending, not income).
    // Why: Budgets cap spending; income doesn't consume a budget cap.
    let alerta: AlertaResponse | null = null;

    if (tipoTransaccion.nombre === 'EGRESO') {
      // Extract month/year from the transaction date
      const mes = fechaTransaccion.getMonth() + 1; // getMonth() is 0-indexed, adjust to 1-12
      const anio = fechaTransaccion.getFullYear();

      // Look for an active budget for this category in this month/year
      // If no budget is configured, no alert is possible — cooperative flexibility.
      const presupuesto = await this.presupuestoService.findPresupuestoPorCategoriaMesAnio(
        data.categoriaId,
        mes,
        anio,
      );

      if (presupuesto) {
        // Calculate TOTAL spending for this category this month (including the new transaction)
        // Why recalculate after insert: The new transaction is already in the DB,
        // so the aggregate will include it — giving the true current total.
        const montoGastado = await this.presupuestoService.calcularGastoMensual(
          data.categoriaId,
          mes,
          anio,
        );

        // Compare: if total spent exceeds the budget limit, fire an alert
        if (montoGastado > presupuesto.montoLimite) {
          // Build the user-friendly alert message
          const mensaje = `⚠️ Has superado el presupuesto de la categoría "${categoria.nombre}". Gastado: ${montoGastado.toFixed(2)}, Límite: ${presupuesto.montoLimite.toFixed(2)}`;

          // Persist the alert in the Alerta table for historical tracking
          // Why persist: Allows future analytics, audit trails, and notification history
          await this.prisma.alerta.create({
            data: {
              presupuestoId: presupuesto.id,
              transaccionId: transaccion.id, // Links the alert to the triggering transaction
              mensaje,
              montoGastado,
              montoLimite: presupuesto.montoLimite,
            },
          });

          // Also return the alert INLINE in the API response
          // Why: Immediate feedback to the client without a separate polling request
          alerta = {
            superado: true,
            mensaje,
            montoGastado,
            montoLimite: presupuesto.montoLimite,
          };
        }
      }
    }

    // Return both the transaction and optional alert together
    return { transaccion, alerta };
  }

  // [HU-04] READ ALL: Returns all transactions for a user within a period.
  // Includes related data for display in transaction lists.
  findByPeriodAndUser(periodoId: number, usuarioId: number) {
    return this.prisma.transaccion.findMany({
      where: { periodoId, usuarioId },
      orderBy: { fecha: 'desc' },
      include: {
        categoria: { select: { nombre: true, tipo: true, icono: true } },
        tipoTransaccion: { select: { nombre: true } },
      },
    });
  }

  // [HU-04] READ ONE: Returns a single transaction with full details.
  async findOne(id: number) {
    const transaccion = await this.prisma.transaccion.findUnique({
      where: { id },
      include: {
        categoria: { select: { nombre: true, tipo: true } },
        tipoTransaccion: { select: { nombre: true } },
        periodo: { select: { nombre: true } },
        // Include associated alert if one was generated
        alerta: true,
      },
    });
    if (!transaccion) {
      throw new NotFoundException(`Transacción con ID ${id} no encontrada.`);
    }
    return transaccion;
  }

  // [HU-04] UPDATE: Modifies an existing transaction (partial PATCH).
  // Note: Changing a transaction won't retroactively recalculate past alerts —
  // this is intentional to preserve the alert audit trail.
  async update(id: number, data: UpdateTransaccionDto) {
    await this.findOne(id); // Validate it exists first

    return this.prisma.transaccion.update({
      where: { id },
      data: {
        ...(data.monto !== undefined && { monto: data.monto }),
        ...(data.descripcion !== undefined && { descripcion: data.descripcion }),
        ...(data.fecha !== undefined && { fecha: new Date(data.fecha) }),
        ...(data.categoriaId !== undefined && { categoriaId: data.categoriaId }),
        ...(data.tipoTransaccionId !== undefined && { tipoTransaccionId: data.tipoTransaccionId }),
        ...(data.periodoId !== undefined && { periodoId: data.periodoId }),
      },
    });
  }

  // [HU-04] DELETE: Permanently removes a transaction and its associated alert (if any).
  // Why: If a transaction is deleted, its alert is no longer meaningful.
  async remove(id: number) {
    await this.findOne(id); // Validate it exists

    // Delete the associated Alerta first (FK constraint — Alerta references Transaccion)
    await this.prisma.alerta.deleteMany({ where: { transaccionId: id } });

    return this.prisma.transaccion.delete({ where: { id } });
  }

  // [HU-06] ALERT HISTORY: Returns all alerts for a specific user.
  // Used to display a notification panel on the frontend.
  findAlertasByUser(usuarioId: number) {
    return this.prisma.alerta.findMany({
      where: {
        transaccion: { usuarioId },
      },
      orderBy: { createdAt: 'desc' },
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
