// [FILE] app.module.ts
// Root application module — registers all feature modules.
// Sprint 3 additions: ConfigModule (global env variables), AuthModule, DashboardModule.

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Required for AuthModule's JwtModule.registerAsync
import { PrismaModule } from './prisma/prisma.module';
import { UsuarioModule } from './usuario/usuario.module';
import { CategoriaModule } from './categoria/categoria.module';
import { TipoTransaccionModule } from './tipo-transaccion/tipo-transaccion.module';
import { PeriodoModule } from './periodo/periodo.module';
import { TransaccionModule } from './transaccion/transaccion.module';
import { PresupuestoModule } from './presupuesto/presupuesto.module';
// [Sprint 3] New modules
import { AuthModule } from './auth/auth.module';
import { DashboardModule } from './dashboard/dashboard.module';

@Module({
  imports: [
    // ConfigModule must be global so AuthModule's JwtModule.registerAsync can inject ConfigService
    // WHY isGlobal: Without it, ConfigService would need to be imported in every module separately
    ConfigModule.forRoot({ isGlobal: true }),

    PrismaModule,          // Global Prisma client (@Global — available to all modules)
    UsuarioModule,         // HU-01: User management
    CategoriaModule,       // HU-02: Category management
    TipoTransaccionModule, // HU-03: Transaction types
    PeriodoModule,         // HU-03: Accounting periods
    TransaccionModule,     // HU-04: Transaction CRUD + coherence validation
    PresupuestoModule,     // HU-05 + HU-06: Budget management + alerts
    AuthModule,            // HU-09: JWT authentication (Sprint 3)
    DashboardModule,       // HU-07: Financial dashboard analytics (Sprint 3)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
