import { IsString, IsDateString, IsOptional, IsIn, Validate } from 'class-validator';

export class CreatePeriodoDto {
  @IsString()
  nombre: string;

  @IsDateString()
  fechaInicio: string;

  @IsDateString()
  fechaFin: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVO', 'INACTIVO'])
  estado?: string;
}

export class UpdatePeriodoDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsDateString()
  fechaInicio?: string;

  @IsOptional()
  @IsDateString()
  fechaFin?: string;

  @IsOptional()
  @IsString()
  @IsIn(['ACTIVO', 'INACTIVO'])
  estado?: string;
}
