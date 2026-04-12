import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { TransaccionService } from './transaccion.service';

@Controller('transacciones')
export class TransaccionController {
  constructor(private readonly transaccionService: TransaccionService) {}

  @Post()
  create(@Body() createTransaccionDto: any) {
    return this.transaccionService.create(createTransaccionDto);
  }

  @Get('periodo/:periodoId/usuario/:usuarioId')
  findByPeriodAndUser(
    @Param('periodoId') periodoId: string, 
    @Param('usuarioId') usuarioId: string
  ) {
    return this.transaccionService.findByPeriodAndUser(+periodoId, +usuarioId);
  }
}
