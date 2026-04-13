// [FILE] common/pipes/date-range.pipe.ts
// Reusable pipe that parses and validates mes (month) + anio (year) query params.
//
// WHY: All dashboard and reporting endpoints filter by month/year. Centralizing
// this parsing prevents repetitive parseInt() + boundary checks in every service.
//
// USAGE: @Query(new DateRangePipe()) { mes, anio }: DateRangeParams
// Then use the returned fechaInicio/fechaFin directly in Prisma where clauses.

import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

export interface DateRangeParams {
  mes: number; // Validated month 1-12
  anio: number; // Validated year >= 2000
  fechaInicio: Date; // First moment of the month (computed)
  fechaFin: Date; // Last moment of the month (computed)
}

@Injectable()
export class DateRangePipe implements PipeTransform {
  transform(value: any): DateRangeParams {
    const mes = parseInt(value?.mes, 10);
    const anio = parseInt(value?.anio, 10);

    // Validate month: must be 1-12 (January = 1, December = 12)
    if (isNaN(mes) || mes < 1 || mes > 12) {
      throw new BadRequestException(
        'El parámetro "mes" debe ser un número entre 1 y 12.',
      );
    }

    // Validate year: must be a reasonable calendar year
    if (isNaN(anio) || anio < 2000 || anio > 2100) {
      throw new BadRequestException(
        'El parámetro "anio" debe ser un año válido (2000-2100).',
      );
    }

    // Pre-compute date boundaries so service methods receive ready-to-use Date objects.
    // WHY: Date boundary computation is error-prone (off-by-one in months); centralizing
    // it in one validated pipe eliminates a whole class of bugs across all services.
    //
    // JS months are 0-indexed: new Date(2025, 5, 1) = June 1st 2025
    const fechaInicio = new Date(anio, mes - 1, 1, 0, 0, 0, 0);
    // new Date(anio, mes, 0) = last day of the given month (day 0 of next month)
    const fechaFin = new Date(anio, mes, 0, 23, 59, 59, 999);

    return { mes, anio, fechaInicio, fechaFin };
  }
}
