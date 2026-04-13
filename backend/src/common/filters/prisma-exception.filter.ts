// [FILE] backend/src/common/filters/prisma-exception.filter.ts
// Catches global Prisma exceptions (like unique constraint failures) and
// seamlessly returns clean HTTP 409 Conflict instead of 500 error.
// This is critical for preventing unhandled DB errors from leaking DB details.

import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Response, Request } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = exception.message.replace(/\n/g, ''); // Default raw message
    
    switch (exception.code) {
      case 'P2002': {
        status = HttpStatus.CONFLICT;
        const target = (exception.meta?.target as string[])?.join(', ');
        message = `El registro ya existe. Se detectó una violación de unicidad${
          target ? ` en el campo(s): [${target}]` : ''
        }.`;
        break;
      }
      case 'P2025': {
        status = HttpStatus.NOT_FOUND;
        message = 'Registro no encontrado o ha sido eliminado.';
        break;
      }
      case 'P2014':
      case 'P2003': {
        status = HttpStatus.UNPROCESSABLE_ENTITY;
        message = 'La operación violó una relación entre tablas (llave foránea). No se puede realizar la acción.';
        break;
      }
    }

    // Must match the HU-08 shape from HttpExceptionFilter!
    response.status(status).json({
      statusCode: status,
      message,
      error: HttpStatus[status] || 'Database Error',
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
