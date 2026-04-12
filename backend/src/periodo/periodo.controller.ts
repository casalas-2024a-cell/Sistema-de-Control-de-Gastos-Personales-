import { Controller, Get, Post, Body } from '@nestjs/common';
import { PeriodoService } from './periodo.service';

@Controller('periodos')
export class PeriodoController {
  constructor(private readonly periodoService: PeriodoService) {}

  @Post()
  create(@Body() createPeriodoDto: any) {
    return this.periodoService.create(createPeriodoDto);
  }

  @Get('activos')
  findActivos() {
    return this.periodoService.findActivos();
  }
}
