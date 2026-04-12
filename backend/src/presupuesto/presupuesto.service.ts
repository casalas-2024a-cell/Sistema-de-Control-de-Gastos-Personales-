// [FILE] presupuesto.service.ts
// Handles all business logic for budget (Presupuesto) management.
// Follows the Controller → Service → Prisma pattern established in Sprint 1.

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePresupuestoDto, UpdatePresupuestoDto } from './dto/presupuesto.dto';

@Injectable()
export class PresupuestoService {
  constructor(private prisma: PrismaService) {}

  // [CREATE] Creates a new monthly budget for a specific category.
  // Business rule: only ONE budget per category per month/year (enforced by @@unique in schema).
  // Why: A cooperative member should define exactly one spending cap per category per cycle.
  async create(data: CreatePresupuestoDto) {
    // Verify the category exists before linking the budget
    // Why: Avoid orphaned budgets pointing to non-existent categories
    const categoria = await this.prisma.categoria.findUnique({
      where: { id: data.categoriaId },
    });
    if (!categoria) {
      throw new NotFoundException(`Categoría con ID ${data.categoriaId} no encontrada.`);
    }

    // The @@unique([categoriaId, mes, anio]) constraint will throw a Prisma error
    // if a duplicate exists — we wrap it in a user-friendly ConflictException.
    try {
      return await this.prisma.presupuesto.create({
        data: {
          categoriaId: data.categoriaId,
          montoLimite: data.montoLimite,
          mes: data.mes,
          anio: data.anio,
        },
        include: {
          categoria: { select: { nombre: true, tipo: true } },
        },
      });
    } catch (error: any) {
      // Prisma error code P2002 = Unique constraint violation
      if (error.code === 'P2002') {
        throw new ConflictException(
          `Ya existe un presupuesto para la categoría "${categoria.nombre}" en ${data.mes}/${data.anio}.`,
        );
      }
      throw error;
    }
  }

  // [FIND ALL] Returns all budgets ordered from most recent to oldest.
  // Includes category name for readability in the response.
  findAll() {
    return this.prisma.presupuesto.findMany({
      orderBy: [{ anio: 'desc' }, { mes: 'desc' }],
      include: {
        categoria: { select: { nombre: true, tipo: true, icono: true } },
      },
    });
  }

  // [FIND ONE] Returns a single budget by its ID.
  // Throws 404 if not found — prevents silent failures.
  async findOne(id: number) {
    const presupuesto = await this.prisma.presupuesto.findUnique({
      where: { id },
      include: {
        categoria: { select: { nombre: true, tipo: true } },
        // Include any alerts generated for this budget
        alertas: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
    if (!presupuesto) {
      throw new NotFoundException(`Presupuesto con ID ${id} no encontrado.`);
    }
    return presupuesto;
  }

  // [UPDATE] Partially updates a budget. Supports changing montoLimite, mes, or anio.
  // Why PATCH (partial): Allows updating only the limit without resetting the period.
  async update(id: number, data: UpdatePresupuestoDto) {
    await this.findOne(id); // Validate existence before updating
    return this.prisma.presupuesto.update({
      where: { id },
      data: {
        ...(data.montoLimite !== undefined && { montoLimite: data.montoLimite }),
        ...(data.mes !== undefined && { mes: data.mes }),
        ...(data.anio !== undefined && { anio: data.anio }),
      },
      include: {
        categoria: { select: { nombre: true } },
      },
    });
  }

  // [DELETE] Removes a budget permanently.
  // Note: Related Alerta records will cascade-delete (or be handled by Prisma null-safety).
  async remove(id: number) {
    await this.findOne(id); // Validate existence
    return this.prisma.presupuesto.delete({ where: { id } });
  }

  // [UTILITY] Calculates total spending for a category in a given month/year.
  // Used internally by TransaccionService to check budget exceedance (HU-06).
  // Why separate method: Promotes single-responsibility; reusable across alert checks.
  async calcularGastoMensual(categoriaId: number, mes: number, anio: number): Promise<number> {
    // Build date range for the target month
    // e.g. mes=6, anio=2025 → from 2025-06-01 to 2025-06-30T23:59:59
    const fechaInicio = new Date(anio, mes - 1, 1); // Month is 0-indexed in JS
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59); // Last day of month

    // Aggregate: sum all transaction amounts for this category in this date range
    // Prisma's aggregate._sum is used for efficient SQL SUM() queries
    const resultado = await this.prisma.transaccion.aggregate({
      where: {
        categoriaId,
        fecha: {
          gte: fechaInicio,
          lte: fechaFin,
        },
      },
      _sum: { monto: true },
    });

    // Return 0 if no transactions exist yet (null-coalesce)
    return resultado._sum.monto ?? 0;
  }

  // [UTILITY] Finds the active budget for a category in a given month/year.
  // Returns null if no budget is defined — alerts only trigger when a budget exists.
  findPresupuestoPorCategoriaMesAnio(categoriaId: number, mes: number, anio: number) {
    return this.prisma.presupuesto.findUnique({
      where: {
        // Uses the compound unique index: @@unique([categoriaId, mes, anio])
        categoriaId_mes_anio: { categoriaId, mes, anio },
      },
    });
  }
}
