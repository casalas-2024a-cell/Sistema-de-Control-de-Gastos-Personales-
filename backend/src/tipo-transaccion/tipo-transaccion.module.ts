import { Module } from '@nestjs/common';
import { TipoTransaccionService } from './tipo-transaccion.service';
import { TipoTransaccionController } from './tipo-transaccion.controller';

@Module({
  controllers: [TipoTransaccionController],
  providers: [TipoTransaccionService],
})
export class TipoTransaccionModule {}
