// [FILE] common/interceptors/response.interceptor.ts
// Global interceptor that wraps ALL successful responses into a uniform shape:
// { statusCode, message, data }
//
// HU-08 CRITERIA: "Todas las respuestas exitosas retornan formato uniforme:
// { statusCode, message, data }."
//
// WHY: Every controller returns raw data. This interceptor wraps it automatically
// so controllers stay thin and never need to manually build the envelope.
// Combined with HttpExceptionFilter, the API delivers a 100% consistent contract.

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface UniformResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<
  T,
  UniformResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<UniformResponse<T>> {
    const httpCtx = context.switchToHttp();
    const response = httpCtx.getResponse();

    return next.handle().pipe(
      map((data) => ({
        statusCode: response.statusCode, // Reflects the HTTP status (200, 201, etc.)
        message: 'Operación exitosa',
        data,
      })),
    );
  }
}
