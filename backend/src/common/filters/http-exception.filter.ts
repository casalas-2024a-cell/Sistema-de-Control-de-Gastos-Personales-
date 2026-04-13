// [FILE] common/filters/http-exception.filter.ts
// Global exception filter that catches ALL HttpExceptions and formats them
// into a uniform JSON structure: { statusCode, message, error, timestamp }.
//
// HU-08 CRITERIA: "Todas las excepciones HTTP retornan un JSON con formato
// uniforme: { statusCode, message, error, timestamp }."
//
// WHY: Without this, NestJS returns different shapes depending on how the
// exception was thrown (string vs object). This filter normalizes everything.

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    // getResponse() can return a string or an object with message/error fields.
    // We normalize both formats into the HU-08 standard shape.
    const exceptionResponse = exception.getResponse();

    // Extract the message — could be a string, an array (validation errors), or nested object
    let message: string | string[];
    let error: string;

    if (typeof exceptionResponse === 'string') {
      // Simple exception: throw new HttpException('texto', 400)
      message = exceptionResponse;
      error = HttpStatus[status] || 'Error';
    } else {
      const resp = exceptionResponse as Record<string, any>;
      // class-validator returns an array in "message" for validation failures
      // HU-08 CRITERIA: "Los errores de validación retornan mensajes claros
      // indicando qué campo falló y por qué."
      message = resp.message || exception.message;
      error = resp.error || HttpStatus[status] || 'Error';
    }

    // HU-08 UNIFORM FORMAT — every single error response follows this exact shape
    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
