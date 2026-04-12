// [FILE] transaccion.dto.ts
// Defines validated DTOs for creating and updating financial transactions.
// Using class-validator ensures data contract compliance before business logic runs.

import {
  IsInt,
  IsNumber,
  IsPositive,
  IsDateString,
  IsString,
  IsOptional,
} from 'class-validator';

// [DTO] CreateTransaccionDto
// All fields required except descripcion. Strict typing prevents malformed transactions.
export class CreateTransaccionDto {
  @IsNumber({}, { message: 'El monto debe ser un número' })
  @IsPositive({ message: 'El monto debe ser positivo' })
  monto: number; // Amount of money in the transaction

  @IsOptional()
  @IsString()
  descripcion?: string; // Human-readable note about the transaction

  @IsDateString({}, { message: 'La fecha debe ser una fecha ISO válida (YYYY-MM-DD)' })
  fecha: string; // Transaction date — used to determine the month for budget aggregation

  @IsInt()
  usuarioId: number; // Owner of the transaction

  @IsInt()
  categoriaId: number; // Category (must exist) — determines which budget to check (HU-06)

  @IsInt()
  tipoTransaccionId: number; // TipoTransaccion (must exist and be EGRESO to trigger alerts)

  @IsInt()
  periodoId: number; // Accounting period this transaction belongs to
}

// [DTO] UpdateTransaccionDto
// All fields optional for PATCH semantics — only send what needs to change.
export class UpdateTransaccionDto {
  @IsOptional()
  @IsNumber()
  @IsPositive()
  monto?: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsOptional()
  @IsInt()
  categoriaId?: number;

  @IsOptional()
  @IsInt()
  tipoTransaccionId?: number;

  @IsOptional()
  @IsInt()
  periodoId?: number;
}
