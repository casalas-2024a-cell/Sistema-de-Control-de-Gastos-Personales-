import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tipos = [
    { nombre: 'INGRESO', descripcion: 'Movimientos de entrada de dinero' },
    { nombre: 'EGRESO', descripcion: 'Movimientos de salida de dinero' },
  ];

  console.log('Seeding TipoTransaccion...');
  for (const tipo of tipos) {
    await prisma.tipoTransaccion.upsert({
      where: { nombre: tipo.nombre },
      update: {},
      create: tipo,
    });
  }
  console.log('Setup finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
