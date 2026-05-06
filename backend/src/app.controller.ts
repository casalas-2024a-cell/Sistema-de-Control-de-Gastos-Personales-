// [FILE] app.controller.ts
import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      mensaje: '¡Bienvenido al backend del Sistema de Control de Gastos Personales!',
      estado: 'Activo',
      version: '1.0.0'
    };
  }

  @Get('health')
  healthCheck() {
    return { status: 'OK', timestamp: new Date().toISOString() };
  }
}
