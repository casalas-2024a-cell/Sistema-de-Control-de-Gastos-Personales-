// [FILE] transaccion.module.ts
// Updated to import PresupuestoModule so TransaccionService can inject PresupuestoService.
// This is the correct NestJS pattern for cross-module dependency injection.
// Why not make PresupusetoService global? Because global providers make testing harder
// and reduce the explicitness of the dependency graph.

import { Module } from '@nestjs/common';
import { TransaccionController } from './transaccion.controller';
import { TransaccionService } from './transaccion.service';
import { PresupuestoModule } from '../presupuesto/presupuesto.module';

@Module({
  // Importing PresupuestoModule provides PresupuestoService to this module's providers
  imports: [PresupuestoModule],
  controllers: [TransaccionController],
  providers: [TransaccionService],
})
export class TransaccionModule {}
