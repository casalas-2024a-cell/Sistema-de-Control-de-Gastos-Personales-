import { IsInt, IsNumber, IsPositive, IsOptional } from 'class-validator';

// [DTO] CreatePresupuestoDto
// HU-05: Budget is now tied to a specific usuario + categoria + periodo triple.
// The mes/anio are NOT sent by the client — they are derived on the service
// from the Periodo.fechaInicio date, ensuring single source of truth.
export class CreatePresupuestoDto {
  @IsInt({ message: 'usuarioId debe ser un número entero' })
  usuarioId: number;

  @IsInt({ message: 'categoriaId debe ser un número entero' })
  categoriaId: number;

  @IsInt({ message: 'periodoId debe ser un número entero' })
  periodoId: number; // Links budget to a Periodo — period must exist

  @IsNumber({}, { message: 'montoLimite debe ser un número' })
  @IsPositive({
    message: 'montoLimite debe ser un valor positivo mayor a cero',
  })
  montoLimite: number;
}

// [DTO] UpdatePresupuestoDto — Only the limit can be updated post-creation.
// Changing usuario/category/period would require deleting and recreating the budget.
export class UpdatePresupuestoDto {
  @IsOptional()
  @IsNumber({}, { message: 'montoLimite debe ser un número' })
  @IsPositive({ message: 'montoLimite debe ser un valor positivo' })
  montoLimite?: number;
}
