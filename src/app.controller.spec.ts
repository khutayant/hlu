import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get(AppController);
  });

  describe('health', () => {
    it('should return ok', () => {
      expect(appController.getHealth()).toEqual({ status: 'ok' });
    });
  });

  describe('ping', () => {
    it('should return pong', () => {
      const result = appController.ping();
      expect(result.status).toBe('pong');
      expect(typeof result.timestamp).toBe('number');
    });
  });

  describe('version', () => {
    it('should return version info', () => {
      const result = appController.getVersion();
      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('name');
    });
  });
});
