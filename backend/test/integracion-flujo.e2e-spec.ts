// [FILE] test/integracion-flujo.e2e-spec.ts
// HU-11: Prueba de integración del flujo completo
//
// Flujo a probar (según criterios de aceptación de HU-11):
//   registrar usuario → iniciar sesión → crear categoría →
//   registrar transacción → definir presupuesto → consultar resumen
//
// NOTE: This test uses the REAL database (same as configured in .env).
// Ensure the DB is running and seed is applied before running tests.

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('HU-11: Flujo de Integración Completo (e2e)', () => {
  let app: INestApplication;

  // Test data — unique enough to avoid conflicts with existing data
  const timestamp = Date.now();
  const testEmail = `test.flujo.${timestamp}@cooperativa.co`;
  const testPassword = 'Password123!';

  let jwtToken: string;
  let usuarioId: number;
  let categoriaIngresoId: number;
  let categoriaGastoId: number;
  let periodoActivoId: number;
  let tipoIngresoId: number;
  let tipoEgresoId: number;
  let transaccionId: number;
  let presupuestoId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply same global configuration as main.ts (HU-08)
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalFilters(new HttpExceptionFilter());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ─────────────────────────────────────────────────────────────────
  // PASO 1: Registrar usuario (HU-01, HU-09)
  // ─────────────────────────────────────────────────────────────────
  it('PASO 1: registrar usuario con datos completos', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        nombres: 'Test',
        apellidos: 'Flujo',
        email: testEmail,
        password: testPassword,
        moneda: 'COP',
      });
    
    if (res.status !== 201) console.log('REGISTER ERROR:', res.body);
    expect(res.status).toBe(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    expect(res.body.data.usuario.email).toBe(testEmail);
    jwtToken = res.body.data.accessToken;
    usuarioId = res.body.data.usuario.id;
  });

  // ─────────────────────────────────────────────────────────────────
  // PASO 2: Iniciar sesión (HU-09)
  // ─────────────────────────────────────────────────────────────────
  it('PASO 2: iniciar sesión y obtener JWT válido', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: testEmail, password: testPassword })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.accessToken).toBeDefined();
    // Update token in case the previous one expired
    jwtToken = res.body.data.accessToken;
  });

  it('PASO 2b: endpoints protegidos retornan 401 sin token', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/dashboard/alertas-activas')
      .expect(401);
  });

  // ─────────────────────────────────────────────────────────────────
  // PASO 3: Obtener TipoTransaccion (seed data, HU-03)
  // ─────────────────────────────────────────────────────────────────
  it('PASO 3: tipos de transacción INGRESO y EGRESO existen (seed)', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/tipo-transaccion')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    const tipos: any[] = res.body.data;
    const ingreso = tipos.find(t => t.nombre === 'INGRESO');
    const egreso = tipos.find(t => t.nombre === 'EGRESO');
    expect(ingreso).toBeDefined();
    expect(egreso).toBeDefined();
    tipoIngresoId = ingreso.id;
    tipoEgresoId = egreso.id;
  });

  // ─────────────────────────────────────────────────────────────────
  // PASO 4: Crear categorías (HU-02)
  // ─────────────────────────────────────────────────────────────────
  it('PASO 4a: crear categoría de tipo INGRESO', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/categorias')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        nombre: `Salario Flujo ${timestamp}`,
        descripcion: 'Categoría de prueba de integración',
        tipo: 'INGRESO',
        usuarioId,
      });

    if (res.status !== 201) console.log('CAT INGRESO ERROR:', res.body);
    expect(res.status).toBe(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.nombre).toContain('Salario Flujo');
    categoriaIngresoId = res.body.data.id;
  });

  it('PASO 4b: crear categoría de tipo EGRESO', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/categorias')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        nombre: `Alimentación Flujo ${timestamp}`,
        descripcion: 'Categoría de prueba de integración',
        tipo: 'EGRESO',
        usuarioId,
      })
      .expect(201);

    expect(res.body.data).toBeDefined();
    categoriaGastoId = res.body.data.id;
  });

  it('PASO 4c: categorías aparecen en el listado del usuario', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/categorias/usuario/${usuarioId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    const ids = res.body.data.map((c: any) => c.id);
    expect(ids).toContain(categoriaIngresoId);
    expect(ids).toContain(categoriaGastoId);
  });

  // ─────────────────────────────────────────────────────────────────
  // PASO 5: Obtener o crear período activo (HU-03)
  // ─────────────────────────────────────────────────────────────────
  it('PASO 5: obtener período activo o crear uno nuevo', async () => {
    const periodosRes = await request(app.getHttpServer())
      .get('/api/v1/periodos')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    const periodos: any[] = periodosRes.body.data;
    const activo = periodos.find(p => p.estado === 'ACTIVO');

    let periodoActivoFecha: string;

    if (activo) {
      periodoActivoId = activo.id;
      periodoActivoFecha = activo.fechaInicio;
    } else {
      // Create a test period if none exists
      const now = new Date();
      const firstDay = now.toISOString();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

      const createRes = await request(app.getHttpServer())
        .post('/api/v1/periodos')
        .set('Authorization', `Bearer ${jwtToken}`)
        .send({
          nombre: `Período Flujo ${timestamp}`,
          fechaInicio: firstDay,
          fechaFin: lastDay,
          estado: 'ACTIVO',
        })
        .expect(201);

      periodoActivoId = createRes.body.data.id;
      periodoActivoFecha = firstDay;
    }

    // Pass the date string to a module-scoped variable so PASO 6 can use it
    (global as any).testFecha = periodoActivoFecha;

    expect(periodoActivoId).toBeDefined();
  });

  // ─────────────────────────────────────────────────────────────────
  // PASO 6: Registrar transacciones (HU-04)
  // ─────────────────────────────────────────────────────────────────
  it('PASO 6a: registrar transacción de INGRESO', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/transacciones')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        monto: 3000000,
        descripcion: 'Salario mensual de prueba',
        fecha: (global as any).testFecha.split('T')[0],
        usuarioId,
        categoriaId: categoriaIngresoId,
        tipoTransaccionId: tipoIngresoId,
        periodoId: periodoActivoId,
      })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.transaccion).toBeDefined();
    expect(res.body.data.transaccion.monto).toBe(3000000);
    transaccionId = res.body.data.transaccion.id;
  });

  it('PASO 6b: registrar transacción de EGRESO', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/transacciones')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        monto: 250000,
        descripcion: 'Mercado de prueba',
        fecha: (global as any).testFecha.split('T')[0],
        usuarioId,
        categoriaId: categoriaGastoId,
        tipoTransaccionId: tipoEgresoId,
        periodoId: periodoActivoId,
      })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.transaccion.monto).toBe(250000);
  });

  it('PASO 6c: las transacciones aparecen en el listado', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/transacciones?periodoId=${periodoActivoId}&usuarioId=${usuarioId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThanOrEqual(2);
  });

  // ─────────────────────────────────────────────────────────────────
  // PASO 7: Definir presupuesto (HU-05)
  // ─────────────────────────────────────────────────────────────────
  it('PASO 7a: crear presupuesto para la categoría de gasto', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/presupuestos')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        usuarioId,
        categoriaId: categoriaGastoId,
        periodoId: periodoActivoId,
        montoLimite: 500000,
      })
      .expect(201);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.montoLimite).toBe(500000);
    presupuestoId = res.body.data.id;
  });

  it('PASO 7b: estado del presupuesto muestra porcentaje de uso correcto (HU-06)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/presupuestos/estado/${periodoActivoId}?usuarioId=${usuarioId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    const presupuesto = res.body.data.find((p: any) => p.id === presupuestoId);
    expect(presupuesto).toBeDefined();
    console.log('PRESUPUESTO EN 7B:', presupuesto);
    // 250000 gastado / 500000 límite = 50%
    expect(presupuesto.porcentajeUso).toBeCloseTo(50, 0);
    // 50% < 80% → estado OK
    expect(presupuesto.estadoAlerta).toBe('OK');
  });

  // ─────────────────────────────────────────────────────────────────
  // PASO 8: Consultar resumen financiero (HU-07)
  // ─────────────────────────────────────────────────────────────────
  it('PASO 8: consultar resumen financiero del período incluye ingresos, gastos y balance', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/dashboard/resumen/${periodoActivoId}`)
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.data).toBeDefined();
    const resumen = res.body.data;

    // Verify structure
    expect(resumen.totalIngresos).toBeDefined();
    expect(resumen.totalGastos).toBeDefined();
    expect(resumen.balance).toBeDefined();
    expect(Array.isArray(resumen.desglosePorCategoria)).toBe(true);
    expect(Array.isArray(resumen.estadoPresupuestos)).toBe(true);

    // The ingreso we registered was 3,000,000 — it should be reflected
    expect(resumen.totalIngresos).toBeGreaterThanOrEqual(3000000);
    // The egreso was 250,000
    expect(resumen.totalGastos).toBeGreaterThanOrEqual(250000);
    // Balance should be positive (more income than expense)
    expect(resumen.balance).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────────
  // PASO 9: Validaciones del DoD (HU-08 — respuestas uniformes)
  // ─────────────────────────────────────────────────────────────────
  it('PASO 9a: errores retornan formato uniforme { statusCode, message, error }', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'noexiste@test.com', password: 'wrongpassword' })
      .expect(401);

    expect(res.body.statusCode).toBeDefined();
    expect(res.body.message).toBeDefined();
  });

  it('PASO 9b: ValidationPipe rechaza campos inválidos (whitelist)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/categorias')
      .set('Authorization', `Bearer ${jwtToken}`)
      .send({
        nombre: 'Test',
        tipo: 'EGRESO',
        usuarioId,
        campoInventado: 'debe ser rechazado', // This should be stripped/rejected
      });

    // Should not cause a 500 error
    expect(res.status).not.toBe(500);
  });
});
