import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { UsuarioModule } from './usuario/usuario.module';
import { CategoriaModule } from './categoria/categoria.module';
import { TipoTransaccionModule } from './tipo-transaccion/tipo-transaccion.module';
import { PeriodoModule } from './periodo/periodo.module';
import { TransaccionModule } from './transaccion/transaccion.module';

@Module({
  imports: [
    PrismaModule,
    UsuarioModule,
    CategoriaModule,
    TipoTransaccionModule,
    PeriodoModule,
    TransaccionModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
