import {
  IsInt,
  IsNumber,
  IsPositive,
  Min,
  Max,
} from 'class-validator';

// [DTO] CreatePresupuestoDto
// Validates the request body when creating a new budget.
// Why class-validator: Ensures invalid data is rejected at the controller level
// before reaching the service or database layer — following fail-fast principle.
export class CreatePresupuestoDto {
  @IsInt({ message: 'categoriaId debe ser un número entero' })
  categoriaId: number; // The category this budget applies to

  @IsNumber({}, { message: 'montoLimite debe ser un número' })
  @IsPositive({ message: 'montoLimite debe ser un valor positivo' })
  montoLimite: number; // Maximum allowed spending amount for the given month/year

  @IsInt()
  @Min(1, { message: 'El mes debe estar entre 1 y 12' })
  @Max(12, { message: 'El mes debe estar entre 1 y 12' })
  mes: number; // Month number (1 = January ... 12 = December)

  @IsInt()
  @Min(2000, { message: 'El año debe ser superior al 2000' })
  anio: number; // Full year, e.g. 2025
}

// [DTO] UpdatePresupuestoDto
// All fields optional — supports partial updates (PATCH semantics).
// Why: PATCH allows only changing what's necessary, reducing payload size and accidental overwrites.
export class UpdatePresupuestoDto {
  @IsNumber()
  @IsPositive()
  montoLimite?: number;

  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsInt()
  @Min(2000)
  anio?: number;
}
