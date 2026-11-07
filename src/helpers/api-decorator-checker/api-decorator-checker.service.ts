import {
  Injectable,
  Logger,
  OnModuleInit,
  RequestMethod,
} from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import {
  APP_CONTROLLER_KEY,
  APP_HTTP_ROUTE_KEY,
  type ApiControllerMeta,
  type ApiHttpRouteMeta,
} from '../../decorators/api.decorator.js';
import { formatPermissionCode } from '../../resources/data/permissions/permission-code.tool.js';
import { PERMISSION_SEED_ROWS } from '../../resources/data/permissions/seed/permission-seed.data.js';
import { AppEnv } from '../../resources/env/app.env.js';
import {
  aggregateRoutePermissions,
  discoverAppRoutePermissions,
} from './discovery/permission-catalog.discovery.js';
import { mergeSeedPermissions } from './tools/merge-permission-catalog.tool.js';
import {
  PermissionCatalogConflictError,
  assertPermissionCode,
} from './tools/permission-code.tool.js';

type Violation = {
  controller: string;
  method?: string;
  httpMethod?: string;
  path: string;
  reason: string;
};

function isDevMode() {
  const env = AppEnv.APP_ENV.toLowerCase();
  return env === 'dev' || env === 'development';
}

/**
 * Dev boot guardrail: controllers must use `@ApiController` and handlers must
 * use `@ApiGet` / `@ApiPost` / `@ApiPut` / `@ApiPatch` / `@ApiDelete`.
 * Bare Nest `@Controller` / `@Get` / `@Post` / … are rejected.
 */
@Injectable()
export class ApiDecoratorCheckerService implements OnModuleInit {
  private readonly logger = new Logger(ApiDecoratorCheckerService.name);

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  onModuleInit(): void {
    if (!isDevMode()) {
      return;
    }

    const violations: Violation[] = [];
    const controllerCodeOwners = new Map<string, string>();
    const endpointCodeOwners = new Map<string, string>();
    let scannedControllers = 0;
    let scannedHandlers = 0;

    for (const wrapper of this.discovery.getControllers()) {
      const controllerClass = this.resolveControllerClass(wrapper);
      if (!controllerClass) {
        continue;
      }

      scannedControllers += 1;
      const controllerName = controllerClass.name;
      const controllerPath = this.formatRoutePath(
        Reflect.getMetadata(PATH_METADATA, controllerClass),
      );

      const controllerMeta = this.reflector.get<ApiControllerMeta | undefined>(
        APP_CONTROLLER_KEY,
        controllerClass,
      );

      if (!controllerMeta?.code?.trim()) {
        violations.push({
          controller: controllerName,
          path: controllerPath || '/',
          reason:
            'Use @ApiController({ code, args? }) — bare Nest @Controller is not allowed',
        });
        continue;
      }

      const controllerCode = controllerMeta.code.trim();
      const prevController = controllerCodeOwners.get(controllerCode);
      if (prevController) {
        violations.push({
          controller: controllerName,
          path: controllerPath || '/',
          reason: `Duplicate controller code "${controllerCode}" (also on ${prevController})`,
        });
      } else {
        controllerCodeOwners.set(controllerCode, controllerName);
      }

      const prototype = controllerClass.prototype as object;
      const methodNames = this.metadataScanner.getAllMethodNames(prototype);

      for (const methodName of methodNames) {
        const handler = (prototype as Record<string, unknown>)[methodName];
        if (typeof handler !== 'function') {
          continue;
        }

        const requestMethod = Reflect.getMetadata(METHOD_METADATA, handler) as
          | RequestMethod
          | undefined;
        if (requestMethod === undefined || requestMethod === null) {
          continue;
        }

        scannedHandlers += 1;
        const httpMethod = this.requestMethodLabel(requestMethod);
        const routePath = this.formatRoutePath(
          Reflect.getMetadata(PATH_METADATA, handler),
        );
        const displayPath = this.joinPath(controllerPath, routePath);
        const owner = `${controllerName}.${methodName}`;

        const meta = this.reflector.get<ApiHttpRouteMeta | undefined>(
          APP_HTTP_ROUTE_KEY,
          handler,
        );

        if (!meta?.code?.trim() || !meta?.name?.trim()) {
          violations.push({
            controller: controllerName,
            method: methodName,
            httpMethod,
            path: displayPath,
            reason:
              'Use @ApiGet/@ApiPost/@ApiPut/@ApiPatch/@ApiDelete with { code, name, permission, args? } — bare Nest HTTP decorators are not allowed',
          });
          continue;
        }

        if (meta.permission === undefined) {
          violations.push({
            controller: controllerName,
            method: methodName,
            httpMethod,
            path: displayPath,
            reason:
              'Api* routes require explicit permission (object or null) — do not omit it',
          });
          continue;
        }

        if (meta.permission !== null) {
          const permissionCode = meta.permission.code?.trim() ?? '';
          const subject = meta.permission.subject?.trim() ?? '';
          const action = String(meta.permission.action ?? '').trim();

          if (!permissionCode || !subject || !action) {
            violations.push({
              controller: controllerName,
              method: methodName,
              httpMethod,
              path: displayPath,
              reason:
                'permission requires code, subject, and action when set (or use null)',
            });
            continue;
          }

          try {
            assertPermissionCode(permissionCode);
          } catch {
            violations.push({
              controller: controllerName,
              method: methodName,
              httpMethod,
              path: displayPath,
              reason: `permission.code "${permissionCode}" must match A-Z0-9_`,
            });
            continue;
          }

          const expectedCode = formatPermissionCode(subject, action);
          if (permissionCode !== expectedCode) {
            violations.push({
              controller: controllerName,
              method: methodName,
              httpMethod,
              path: displayPath,
              reason: `permission.code must be "${expectedCode}" for ${subject}.${action} (got "${permissionCode}")`,
            });
            continue;
          }
        }

        const code = meta.code.trim();
        const prev = endpointCodeOwners.get(code);
        if (prev) {
          violations.push({
            controller: controllerName,
            method: methodName,
            httpMethod,
            path: displayPath,
            reason: `Duplicate endpoint code "${code}" (also on ${prev})`,
          });
          continue;
        }
        endpointCodeOwners.set(code, owner);
      }
    }

    if (violations.length > 0) {
      const details = violations
        .sort((a, b) =>
          `${a.controller}.${a.method ?? ''}`.localeCompare(
            `${b.controller}.${b.method ?? ''}`,
          ),
        )
        .map((item) => {
          const who = item.method
            ? `${item.controller}.${item.method}`
            : item.controller;
          const verb = item.httpMethod ? `${item.httpMethod} ` : '';
          return `- ${who} [${verb}${item.path}]\n  ${item.reason}`;
        })
        .join('\n');

      throw new Error(
        `Invalid @ApiController / @Api* catalog. Application startup aborted (dev only).\n${details}`,
      );
    }

    this.assertPermissionCatalogConflicts();

    this.logger.log(
      `API decorator check passed ` +
        `(${scannedControllers} controllers, ${controllerCodeOwners.size} controller codes; ` +
        `${scannedHandlers} handlers, ${endpointCodeOwners.size} endpoint codes).`,
    );
  }

  /**
   * One permission code ↔ one subject+action (and seed rows).
   * Uses `tools/permission-code.tool` + `merge-permission-catalog.tool`.
   */
  private assertPermissionCatalogConflicts(): void {
    try {
      const discovered = discoverAppRoutePermissions(
        this.discovery,
        this.metadataScanner,
        this.reflector,
      );
      const routes = aggregateRoutePermissions(discovered);
      const catalog = mergeSeedPermissions(
        routes,
        PERMISSION_SEED_ROWS.map((row) => ({
          code: row.code,
          subject: row.subject,
          action: row.action,
          name: row.name,
          description: row.description,
        })),
      );
      this.logger.log(
        `Permission catalog check passed ` +
          `(${discovered.length} route bindings, ${catalog.length} permission codes).`,
      );
    } catch (error) {
      if (error instanceof PermissionCatalogConflictError) {
        throw new Error(
          `Permission catalog conflict. Application startup aborted (dev only).\n${error.message}`,
        );
      }
      throw error;
    }
  }

  private resolveControllerClass(
    wrapper: InstanceWrapper,
  ): (new (...args: unknown[]) => unknown) | null {
    const metatype = wrapper.metatype;
    if (typeof metatype !== 'function' || !metatype.name) {
      return null;
    }
    return metatype as new (...args: unknown[]) => unknown;
  }

  private requestMethodLabel(method: RequestMethod): string {
    const label = RequestMethod[method];
    return typeof label === 'string' ? label : String(method);
  }

  private formatRoutePath(path: unknown): string {
    if (path === undefined || path === null || path === '') {
      return '';
    }
    if (Array.isArray(path)) {
      return path.map(String).join(',');
    }
    return String(path).replace(/^\/+/, '');
  }

  private joinPath(controllerPath: string, routePath: string): string {
    if (!controllerPath) {
      return routePath || '/';
    }
    if (!routePath) {
      return controllerPath;
    }
    return `${controllerPath}/${routePath}`.replace(/\/{2,}/g, '/');
  }
}
