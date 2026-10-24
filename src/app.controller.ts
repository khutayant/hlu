import {
  Controller,
  Get,
  Param,
  Req,
  Res,
  VERSION_NEUTRAL,
  Version,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { join, resolve, sep } from 'node:path';
import { AppService } from './app.service.js';
import { AppEnv } from './resources/env/app.env.js';

const UI_ROUTE = AppEnv.UI_BASE_URL.replace(/^\/|\/$/g, '');

@Controller()
export class AppController {
  private readonly uiDirectory = resolve(AppEnv.CWD, 'ui');

  constructor(private readonly appService: AppService) {}

  @Get()
  @Version(VERSION_NEUTRAL)
  getApp(@Res() response: Response) {
    return response.redirect(AppEnv.UI_BASE_URL);
  }

  /** Bare `/ui/hlu` → `/ui/hlu/` so relative asset URLs resolve under the base. */
  @Get(UI_ROUTE)
  @Version(VERSION_NEUTRAL)
  redirectUiRoot(@Req() request: Request, @Res() response: Response) {
    const pathOnly = request.originalUrl.split('?')[0] ?? '';
    if (pathOnly.endsWith('/')) {
      return this.sendUiFile('', response);
    }
    return response.redirect(301, AppEnv.UI_BASE_URL);
  }

  @Get(`${UI_ROUTE}/{*pathname}`)
  @Version(VERSION_NEUTRAL)
  serveUi(
    @Param('pathname') pathname: string | string[] | undefined,
    @Res() response: Response,
  ) {
    const relativePath = Array.isArray(pathname)
      ? pathname.filter(Boolean).join('/')
      : (pathname ?? '');

    return this.sendUiFile(relativePath, response);
  }

  @Get('version')
  @Version(VERSION_NEUTRAL)
  getVersion() {
    return this.appService.getVersion();
  }

  @Get('health')
  @Version(VERSION_NEUTRAL)
  getHealth() {
    return { status: 'ok' };
  }

  @Get('ping')
  @Version(VERSION_NEUTRAL)
  ping() {
    return { status: 'pong', timestamp: Date.now() };
  }

  private sendUiFile(relativePath: string, response: Response) {
    const requestedPath = resolve(this.uiDirectory, relativePath);
    const isInsideUiDirectory =
      requestedPath === this.uiDirectory ||
      requestedPath.startsWith(`${this.uiDirectory}${sep}`);

    if (!isInsideUiDirectory) {
      return response.status(404).end();
    }

    const fallbackPath = join(this.uiDirectory, 'index.html');
    const filePath = relativePath ? requestedPath : fallbackPath;

    return response.sendFile(filePath, (error) => {
      if (error && filePath !== fallbackPath) {
        return response.sendFile(fallbackPath);
      }
    });
  }
}
