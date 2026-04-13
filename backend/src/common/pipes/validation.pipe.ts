// [FILE] common/pipes/validation.pipe.ts
// Custom global validation pipe factory.
//
// HU-08 CRITERIA:
//   - "El ValidationPipe global está configurado con whitelist: true y forbidNonWhitelisted: true."
//   - "Los errores de validación retornan mensajes claros indicando qué campo falló y por qué."
//
// WHY CUSTOM FACTORY:
//   NestJS's built-in ValidationPipe supports these options, but we centralize the
//   configuration here so main.ts stays clean and the options are documented.
//
// HOW IT WORKS:
//   whitelist: true → Strips properties NOT decorated with class-validator decorators.
//     Example: If DTO has { email, password } but client sends { email, password, admin: true },
//     the "admin" field is silently removed before reaching the service.
//   forbidNonWhitelisted: true → Instead of silently stripping, REJECTS with 400 error.
//     This is stricter: the client gets "property admin should not exist".
//   transform: true → Auto-converts payloads to DTO class instances (enables decorator metadata).
//
// VALIDATION ERROR FORMAT:
//   When validation fails, class-validator returns an array of messages like:
//     ["email must be an email", "password must be longer than 8 characters"]
//   The HttpExceptionFilter (common/filters/) catches this and wraps it into the
//   HU-08 uniform error format: { statusCode: 400, message: [...], error, timestamp }

import { ValidationPipe } from '@nestjs/common';

export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    whitelist: true, // Strip unknown properties from the body
    forbidNonWhitelisted: true, // Reject requests with unexpected properties (400 error)
    transform: true, // Auto-transform payload to DTO class instance
    transformOptions: {
      enableImplicitConversion: true, // Allows @Query() string → number conversion via @IsInt()
    },
  });
}
