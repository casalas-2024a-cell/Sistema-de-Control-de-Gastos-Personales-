// [FILE] auth/strategies/jwt.strategy.ts
// Implements the Passport JWT strategy used to validate Bearer tokens on protected routes.
//
// HOW IT WORKS:
//   1. A request arrives with "Authorization: Bearer <token>" header.
//   2. JwtStrategy extracts the token, verifies its signature against JWT_SECRET,
//      and checks the expiry. If valid, Passport calls validate() with the decoded payload.
//   3. The return value of validate() is attached to req.user and available in controllers.
//
// WHY PASSPORT: NestJS has first-class support for Passport strategies. This decouples
// token validation from business logic — the guard calls the strategy automatically.

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

// JwtPayload: what we embed in the token at login time.
// Keep it minimal — only identifiers needed for authorization decisions.
export interface JwtPayload {
  sub: number;     // Subject: the user's ID (standard JWT claim)
  email: string;   // For display/logging purposes
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Extract token from the Authorization header (Bearer scheme)
      // WHY fromAuthHeaderAsBearerToken: Industry standard; avoids cookie-based CSRF risks
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Reject tokens that have passed their expiry date
      ignoreExpiration: false,
      // Read the secret from environment (never hardcode secrets in code)
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  // Called automatically by Passport AFTER token signature + expiry validation.
  // The payload here is already decoded and trusted.
  // Return value → req.user (accessible in controllers via @Req() or custom decorator)
  async validate(payload: JwtPayload) {
    if (!payload?.sub) {
      // This should not happen with a valid token, but guards against tampered payloads
      throw new UnauthorizedException('Token inválido o malformado.');
    }
    return { userId: payload.sub, email: payload.email };
  }
}
