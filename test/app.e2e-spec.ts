import {
  INestApplication,
  RequestMethod,
  VersioningType,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AppController } from './../src/app.controller.js';
import { AppService } from './../src/app.service.js';
import { AppEnv } from './../src/resources/env/app.env.js';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(`/api/${AppEnv.BASE}`, {
      exclude: [
        { path: '', method: RequestMethod.GET },
        { path: 'health', method: RequestMethod.GET },
      ],
    });
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
      prefix: 'v',
    });
    await app.init();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it(`/api/${AppEnv.BASE}/ping (GET)`, () => {
    return request(app.getHttpServer())
      .get(`/api/${AppEnv.BASE}/ping`)
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('pong');
        expect(typeof res.body.timestamp).toBe('number');
      });
  });

  it(`/api/${AppEnv.BASE}/version (GET)`, () => {
    return request(app.getHttpServer())
      .get(`/api/${AppEnv.BASE}/version`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('version');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
