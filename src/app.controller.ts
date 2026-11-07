import {
  Param,
  Req,
  Res,
  VERSION_NEUTRAL,
  Version,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { join, resolve, sep } from 'node:path';
import { AppService } from './app.service.js';
import {
  ApiController,
  ApiGet,
} from './decorators/api.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { AppEnv } from './resources/env/app.env.js';

const UI_ROUTE = AppEnv.UI_BASE_URL.replace(/^\/|\/$/g, '');

@ApiController({ code: 'APP' })
export class AppController {
  private readonly uiDirectory = resolve(AppEnv.CWD, 'ui');

  constructor(private readonly appService: AppService) {}

  @Public()
  @ApiGet({
    code: 'APP_ROOT',
    name: 'Redirect to UI',
    permission: null,
  })
  @Version(VERSION_NEUTRAL)
  getApp(@Res() response: Response) {
    return response.redirect(AppEnv.UI_BASE_URL);
  }

  /** Bare `/ui/hlu` → `/ui/hlu/` so relative asset URLs resolve under the base. */
  @Public()
  @ApiGet({
    code: 'APP_UI_ROOT',
    name: 'UI root redirect',
    args: UI_ROUTE,
    permission: null,
  })
  @Version(VERSION_NEUTRAL)
  redirectUiRoot(@Req() request: Request, @Res() response: Response) {
    const pathOnly = request.originalUrl.split('?')[0] ?? '';
    if (pathOnly.endsWith('/')) {
      return this.sendUiFile('', response);
    }
    return response.redirect(301, AppEnv.UI_BASE_URL);
  }

  @Public()
  @ApiGet({
    code: 'APP_UI_ASSET',
    name: 'Serve UI asset',
    args: `${UI_ROUTE}/{*pathname}`,
    permission: null,
  })
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

  @Public()
  @ApiGet({
    code: 'APP_VERSION',
    name: 'App version',
    args: 'version',
    permission: null,
  })
  @Version(VERSION_NEUTRAL)
  getVersion() {
    return this.appService.getVersion();
  }

  @Public()
  @ApiGet({
    code: 'APP_HEALTH',
    name: 'Health check',
    args: 'health',
    permission: null,
  })
  @Version(VERSION_NEUTRAL)
  getHealth() {
    return { status: 'ok' };
  }

  @Public()
  @ApiGet({
    code: 'APP_PING',
    name: 'Ping',
    args: 'ping',
    permission: null,
  })
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
