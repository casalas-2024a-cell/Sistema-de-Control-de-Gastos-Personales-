// [FILE] presupuesto.module.ts
// Bundles the Presupuesto controller and service into a self-contained NestJS module.
// Why: NestJS modules enforce encapsulation; each domain owns its providers.
// PresupuestoService is exported because TransaccionService needs it for budget alert checks (HU-06).

import { Module } from '@nestjs/common';
import { PresupuestoController } from './presupuesto.controller';
import { PresupuestoService } from './presupuesto.service';

@Module({
  controllers: [PresupuestoController],
  providers: [PresupuestoService],
  // Exporting PresupuestoService so TransaccionModule can inject it without circular dependencies
  exports: [PresupuestoService],
})
export class PresupuestoModule {}
