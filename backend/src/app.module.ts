// [FILE] app.module.ts
// Root module of the application. Registers all feature modules.
// Sprint 2 additions: PresupuestoModule is imported here.
// TransaccionModule implicitly gets PresupuestoService via its own import of PresupuestoModule.

import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsuarioModule } from './usuario/usuario.module';
import { CategoriaModule } from './categoria/categoria.module';
import { TipoTransaccionModule } from './tipo-transaccion/tipo-transaccion.module';
import { PeriodoModule } from './periodo/periodo.module';
import { TransaccionModule } from './transaccion/transaccion.module';
// [Sprint 2] New budget management module
import { PresupuestoModule } from './presupuesto/presupuesto.module';

@Module({
  imports: [
    PrismaModule,        // Global DB layer
    UsuarioModule,       // HU-01
    CategoriaModule,     // HU-02
    TipoTransaccionModule, // HU-03
    PeriodoModule,       // HU-03
    TransaccionModule,   // HU-04
    PresupuestoModule,   // HU-05, HU-06 (Sprint 2)
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
