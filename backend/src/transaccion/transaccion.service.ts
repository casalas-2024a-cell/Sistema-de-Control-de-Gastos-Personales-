// [FILE] transaccion.service.ts
// Implements HU-04 complete transaction CRUD with:
//   - FK existence validation (category, period, transaction type)
//   - TYPE↔CATEGORY coherence validation (e.g. INGRESO transaction must use INGRESO category)
//   - Filtering by both periodoId and optional categoriaId
//   - HU-06: 80% warning + 100% exceeded alerts on EGRESO transactions

import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PresupuestoService } from '../presupuesto/presupuesto.service';
import {
  CreateTransaccionDto,
  UpdateTransaccionDto,
} from './dto/transaccion.dto';

export interface AlertaResponse {
  tipoAlerta: 'ADVERTENCIA' | 'EXCEDIDO'; // Which threshold was crossed
  mensaje: string;
  porcentajeUso: number; // e.g. 85.5 or 112.0
  montoGastado: number;
  montoLimite: number;
}

@Injectable()
export class TransaccionService {
  constructor(
    private prisma: PrismaService,
    private presupuestoService: PresupuestoService,
  ) {}

  async create(
    data: CreateTransaccionDto,
  ): Promise<{ transaccion: any; alerta: AlertaResponse | null }> {
    // ─── A. VALIDATE ALL FOREIGN KEYS EXIST ───
    const categoria = await this.prisma.categoria.findUnique({
      where: { id: data.categoriaId },
    });
    if (!categoria)
      throw new NotFoundException(
        `Categoría con ID ${data.categoriaId} no encontrada.`,
      );

    const tipoTransaccion = await this.prisma.tipoTransaccion.findUnique({
      where: { id: data.tipoTransaccionId },
    });
    if (!tipoTransaccion)
      throw new NotFoundException(
        `Tipo de transacción con ID ${data.tipoTransaccionId} no encontrado.`,
      );

    const periodo = await this.prisma.periodo.findUnique({
      where: { id: data.periodoId },
    });
    if (!periodo)
      throw new NotFoundException(
        `Período con ID ${data.periodoId} no encontrado.`,
      );

    // ─── B. COHERENCE VALIDATION: TipoTransaccion must match Categoria.tipo ───
    // Why: A user shouldn't register an INGRESO transaction under an EGRESO category.
    // This is a business rule of the cooperative's expense control system.
    // Example: Tipo "INGRESO" + Categoría tipo "EGRESO" → reject with clear message.
    if (tipoTransaccion.nombre !== categoria.tipo) {
      throw new BadRequestException(
        `El tipo de transacción "${tipoTransaccion.nombre}" no es coherente con el tipo de categoría "${categoria.tipo}". ` +
          `Una categoría de tipo "${categoria.tipo}" solo acepta transacciones de tipo "${categoria.tipo}".`,
      );
    }

    const fechaTransaccion = new Date(data.fecha);

    // ─── C. PERSIST THE TRANSACTION ───
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

    // ─── D. BUDGET ALERT CHECK (HU-06) ───
    // Only EGRESO transactions can exceed a budget (income doesn't consume spending limits).
    let alerta: AlertaResponse | null = null;

    if (tipoTransaccion.nombre === 'EGRESO') {
      // Find a budget for this user+category+period combination
      const presupuesto =
        await this.presupuestoService.findPresupuestoPorCategoriaYPeriodo(
          data.categoriaId,
          data.periodoId,
          data.usuarioId,
        );

      if (presupuesto) {
        // Recalculate total spending AFTER the transaction was persisted
        // This gives us the true current total including the new transaction
        const montoGastado = await this.presupuestoService.calcularGastoMensual(
          data.categoriaId,
          presupuesto.mes,
          presupuesto.anio,
        );

        // Calculate percentage usage: (spent / limit) × 100
        const porcentajeUso = parseFloat(
          ((montoGastado / presupuesto.montoLimite) * 100).toFixed(2),
        );

        // Determine which threshold was crossed (if any)
        // HU-06: >100% = EXCEDIDO (red), 80–100% = ADVERTENCIA (yellow)
        let tipoAlerta: 'ADVERTENCIA' | 'EXCEDIDO' | null = null;
        let mensaje = '';

        if (porcentajeUso >= 100) {
          tipoAlerta = 'EXCEDIDO';
          mensaje = `🔴 Has superado el presupuesto de "${categoria.nombre}". Gastado: $${montoGastado.toFixed(2)} de $${presupuesto.montoLimite.toFixed(2)} (${porcentajeUso}%)`;
        } else if (porcentajeUso >= 80) {
          tipoAlerta = 'ADVERTENCIA';
          mensaje = `🟡 Advertencia: llevas el ${porcentajeUso}% del presupuesto de "${categoria.nombre}". Gastado: $${montoGastado.toFixed(2)} de $${presupuesto.montoLimite.toFixed(2)}`;
        }

        if (tipoAlerta) {
          // Persist alert for historical tracking and notification panel
          // Use upsert pattern to avoid duplicate alerts per transaction
          await this.prisma.alerta.upsert({
            where: { transaccionId: transaccion.id },
            create: {
              presupuestoId: presupuesto.id,
              transaccionId: transaccion.id,
              mensaje,
              tipoAlerta,
              porcentajeUso,
              montoGastado,
              montoLimite: presupuesto.montoLimite,
            },
            update: {
              mensaje,
              tipoAlerta,
              porcentajeUso,
              montoGastado,
            },
          });

          alerta = {
            tipoAlerta,
            mensaje,
            porcentajeUso,
            montoGastado,
            montoLimite: presupuesto.montoLimite,
          };
        }
      }
    }

    return { transaccion, alerta };
  }

  // [HU-04 — LIST] Returns transactions filtered by period, user, and optionally category.
  // Why optional categoriaId: HU-04 explicitly requires filtering by both period AND category.
  findAll(periodoId: number, usuarioId: number, categoriaId?: number) {
    return this.prisma.transaccion.findMany({
      where: {
        periodoId,
        usuarioId,
        ...(categoriaId && { categoriaId }), // Only apply category filter if provided
      },
      orderBy: { fecha: 'desc' },
      include: {
        categoria: { select: { nombre: true, tipo: true, icono: true } },
        tipoTransaccion: { select: { nombre: true } },
      },
    });
  }

  // [HU-04 — FIND ONE] Returns a single transaction with full details including alert.
  async findOne(id: number) {
    const transaccion = await this.prisma.transaccion.findUnique({
      where: { id },
      include: {
        categoria: { select: { nombre: true, tipo: true } },
        tipoTransaccion: { select: { nombre: true } },
        periodo: { select: { nombre: true } },
        alerta: true,
      },
    });
    if (!transaccion)
      throw new NotFoundException(`Transacción con ID ${id} no encontrada.`);
    return transaccion;
  }

  // [HU-04 — UPDATE] Partially updates a transaction.
  async update(id: number, data: UpdateTransaccionDto) {
    await this.findOne(id);
    return this.prisma.transaccion.update({
      where: { id },
      data: {
        ...(data.monto !== undefined && { monto: data.monto }),
        ...(data.descripcion !== undefined && {
          descripcion: data.descripcion,
        }),
        ...(data.fecha !== undefined && { fecha: new Date(data.fecha) }),
        ...(data.categoriaId !== undefined && {
          categoriaId: data.categoriaId,
        }),
        ...(data.tipoTransaccionId !== undefined && {
          tipoTransaccionId: data.tipoTransaccionId,
        }),
        ...(data.periodoId !== undefined && { periodoId: data.periodoId }),
      },
    });
  }

  // [HU-04 — DELETE] Removes a transaction and its linked alert.
  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.alerta.deleteMany({ where: { transaccionId: id } });
    return this.prisma.transaccion.delete({ where: { id } });
  }

  // [HU-06] Returns alert history for a user's notification panel.
  findAlertasByUser(usuarioId: number) {
    return this.prisma.alerta.findMany({
      where: { transaccion: { usuarioId } },
      orderBy: { createdAt: 'desc' },
      include: {
        presupuesto: {
          include: { categoria: { select: { nombre: true, icono: true } } },
        },
      },
    });
  }
}
