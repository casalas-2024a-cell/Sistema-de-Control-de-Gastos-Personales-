// [FILE] auth/auth.module.ts
// Configures and exposes the authentication subsystem.
//
// KEY DECISIONS:
//   - JwtModule.registerAsync reads JWT_SECRET from ConfigService (environment variable)
//     rather than hardcoding it. WHY: Secrets must never be in source control.
//   - PassportModule sets 'jwt' as the default strategy — this means @UseGuards(AuthGuard())
//     (without argument) would also work, but we use the explicit JwtAuthGuard for clarity.
//   - JwtAuthGuard and JwtStrategy are exported so other modules (e.g. DashboardModule)
//     can import this module and use the guard without re-declaring the strategy.

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Async configuration: reads JWT_SECRET at runtime from environment.
    // WHY async: ConfigService is asynchronous; it must be injected after AppModule loads ConfigModule.
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'FALLBACK_SECRET_CHANGE_IN_PROD'),
        signOptions: {
          expiresIn: '24h', // Tokens expire in 24 hours — balance of security vs UX
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,   // Passport strategy — validates incoming tokens
    JwtAuthGuard,  // Guard used by @UseGuards(JwtAuthGuard)
  ],
  // Export guard + module so any importing module can apply JwtAuthGuard to its routes
  exports: [JwtAuthGuard, JwtModule],
})
export class AuthModule {}
