// [FILE] auth/guards/jwt-auth.guard.ts
// A thin wrapper around Passport's AuthGuard('jwt').
// Applying @UseGuards(JwtAuthGuard) to any controller or route will:
//   1. Invoke JwtStrategy to extract and validate the Bearer token.
//   2. Reject the request with 401 Unauthorized if the token is absent, expired, or invalid.
//   3. Attach req.user with the validated payload if the token is OK.
//
// WHY WRAP: Having our own named class prevents refactoring if we ever swap strategies.
// It also allows overriding handleRequest() to customize the rejection response.

import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to provide a clearer error message than Passport's default.
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      // info contains Passport error details (e.g. 'TokenExpiredError', 'JsonWebTokenError')
      const message = info?.name === 'TokenExpiredError'
        ? 'El token JWT ha expirado. Por favor inicia sesión nuevamente.'
        : 'Acceso no autorizado. Se requiere un token JWT válido.';
      throw new UnauthorizedException(message);
    }
    return user;
  }
}
