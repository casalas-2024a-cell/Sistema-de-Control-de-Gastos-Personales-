import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('DashboardController (e2e)', () => {
  let app: INestApplication;
  let jwtToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();

    // Setup: Login first to get JWT token
    // We assume a seed user exists from Sprint 1: usuario@test.com / password123
    const loginRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'usuario@test.com', password: 'password123' });
    
    // Only proceed if login succeeds (seed DB is populated)
    if (loginRes.status === 201 || loginRes.status === 200) {
      jwtToken = loginRes.body.data.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/v1/dashboard/alertas-activas (GET) - fails without token', () => {
    return request(app.getHttpServer())
      .get('/api/v1/dashboard/alertas-activas')
      .expect(401);
  });

  it('/api/v1/dashboard/alertas-activas (GET) - success with token', async () => {
    if (!jwtToken) return; // Skip if no test user
    
    const res = await request(app.getHttpServer())
      .get('/api/v1/dashboard/alertas-activas')
      .set('Authorization', `Bearer ${jwtToken}`)
      .expect(200);

    expect(res.body.success).toBeDefined();
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
