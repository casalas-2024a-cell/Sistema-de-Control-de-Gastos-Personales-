import { IsString, IsInt, IsOptional, IsIn } from 'class-validator';

export class CreateCategoriaDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsString()
  @IsIn(['INGRESO', 'EGRESO'], { message: 'El tipo debe ser INGRESO o EGRESO' })
  tipo: string;

  @IsOptional()
  @IsString()
  icono?: string;

  @IsInt()
  usuarioId: number;
}

export class UpdateCategoriaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsString()
  @IsIn(['INGRESO', 'EGRESO'])
  tipo?: string;

  @IsOptional()
  @IsString()
  icono?: string;
}
