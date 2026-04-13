// [FILE] main.ts
// Application bootstrap — registers global pipes, interceptors, and filters.
//
// HU-08: All three cross-cutting concerns are registered HERE as globals:
//   1. ValidationPipe (createValidationPipe) → validates all DTOs
//   2. ResponseInterceptor → wraps success responses as { statusCode, message, data }
//   3. HttpExceptionFilter → wraps errors as { statusCode, message, error, timestamp }
//
// The order matters:
//   Pipe runs FIRST (validates input) → Controller logic runs → Interceptor wraps output
//   If anything throws, the Filter catches it before the response is sent.

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { createValidationPipe } from './common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix — all routes start with /api/v1/
  app.setGlobalPrefix('api/v1');

  // Enable CORS for frontend communication (Vite runs on a different port)
  app.enableCors();

  // [HU-08] Register the centralized validation pipe from common module
  app.useGlobalPipes(createValidationPipe());

  // [HU-08] Wrap all successful responses in uniform format
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Use Custom Prisma DB Filter FIRST (Order is inverted when loading filters)
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new PrismaClientExceptionFilter()
  );

  await app.listen(process.env.PORT || 3000);
  console.log(
    `🚀 API running on http://localhost:${process.env.PORT || 3000}/api/v1`,
  );
}
bootstrap();
