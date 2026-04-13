// [FILE] auth/dto/register.dto.ts
// Validates the self-registration request body.
// HU-09 CRITERIA: "POST /auth/register" for user self-registration.

import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsDateString,
} from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'El nombre es obligatorio' })
  nombres: string;

  @IsString({ message: 'El apellido es obligatorio' })
  apellidos: string;

  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  password: string;

  @IsOptional()
  @IsDateString({}, { message: 'La fecha de nacimiento debe ser ISO válida' })
  fechaNacimiento?: string;

  @IsOptional()
  @IsString()
  moneda?: string;
}
