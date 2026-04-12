import { Controller, Get } from '@nestjs/common';
import { TipoTransaccionService } from './tipo-transaccion.service';

@Controller('tipo-transaccion')
export class TipoTransaccionController {
  constructor(private readonly service: TipoTransaccionService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
