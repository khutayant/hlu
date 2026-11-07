import {
  applyDecorators,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  Put,
  SetMetadata,
} from '@nestjs/common';
import type { PermissionActionCode } from '../resources/data/permissions/actions/permission-action.data.js';
import type { PermissionSubjectCode } from '../resources/data/permissions/subjects/permission-subject.data.js';

/**
 * Reflector metadata key for {@link ApiController}.
 * Value: {@link ApiControllerMeta}.
 */
export const APP_CONTROLLER_KEY = 'app_controller';

/**
 * Reflector metadata key for {@link ApiGet} / {@link ApiPost} / …
 * Value: {@link ApiHttpRouteMeta}.
 */
export const APP_HTTP_ROUTE_KEY = 'app_http_route';

/** Catalog fields attached by `@ApiController`. */
export type ApiControllerMeta = {
  code: string;
  description?: string | null;
  extra?: Record<string, unknown> | null;
};

/**
 * Single object argument for `@ApiController`.
 *
 * - `args` omitted → `@Controller()`
 * - `args: 'auth'` → `@Controller('auth')`
 * - `args: ['a', 'b']` → `@Controller(['a', 'b'])`
 *
 * No `name` — DB name is always the Nest class name.
 */
export type ApiControllerOptions = {
  code: string;
  description?: string | null;
  extra?: Record<string, unknown> | null;
  /** Nest `@Controller` path prefix(es). */
  args?: string | string[];
};

/** External RBAC requirement on an `@Api*` route. */
export type ApiRoutePermissionMeta = {
  /** Permission maintenance code (`A-Z0-9_`). */
  code: string;
  subject: PermissionSubjectCode;
  action: PermissionActionCode;
  /** What the permission allows (catalog / Forbidden UI) — not the HTTP route description. */
  description?: string | null;
};

/** Catalog fields attached by `@Api*` HTTP wrappers. */
export type ApiHttpRouteMeta = {
  code: string;
  name: string;
  description?: string | null;
  /** Opaque JSON stored on endpoint masters. */
  extra?: Record<string, unknown> | null;
  /**
   * External RBAC. Always set explicitly:
   * - object → enforce subject/action
   * - `null` → deliberately unbound (guards skip; JWT/public still apply)
   */
  permission: ApiRoutePermissionMeta | null;
};

/**
 * Single object argument for `@ApiGet` / `@ApiPost` / …
 *
 * - `args` omitted or `[]` → `@Get()` / `@Post()` / …
 * - `args: 'google'` → `@Get('google')`
 * - `args: ['google']` → `@Get('google')`
 * - Nest multi-path array: `args: [['a', 'b']]` → `@Get(['a', 'b'])`
 * - Optional `description` / `extra` → endpoint registry masters
 * - **Required** `permission`: object to enforce RBAC, or `null` if unbound
 *   (also skipped when `req.isPublic`)
 */
export type ApiHttpRouteOptions = {
  code: string;
  name: string;
  description?: string | null;
  extra?: Record<string, unknown> | null;
  args?: string | string[] | Array<string | string[]>;
  /** RBAC requirement, or `null` when the route is deliberately unbound. */
  permission: ApiRoutePermissionMeta | null;
};

/**
 * Catalogued controller — replaces bare `@Controller`.
 * Persist via controller-endpoint-registry → MainControllerMaster.
 */
export const ApiController = (
  options: ApiControllerOptions,
): ClassDecorator => {
  const meta: ApiControllerMeta = {
    code: options.code,
    description: options.description ?? null,
    extra: options.extra ?? null,
  };

  const args = options.args;
  if (args === undefined) {
    return applyDecorators(SetMetadata(APP_CONTROLLER_KEY, meta), Controller());
  }
  // Nest: `Controller(prefix?: string | string[])` — pass string or string[] as one arg.
  return applyDecorators(
    SetMetadata(APP_CONTROLLER_KEY, meta),
    Controller(args),
  );
};

function normalizeNestArgs(
  args: ApiHttpRouteOptions['args'],
): Array<string | string[]> {
  if (args === undefined) {
    return [];
  }
  return Array.isArray(args) ? args : [args];
}

type NestPathDecorator = (
  ...paths: Array<string | string[]>
) => MethodDecorator;

function apiHttp(
  verb: NestPathDecorator,
  options: ApiHttpRouteOptions,
): MethodDecorator {
  const nestArgs = normalizeNestArgs(options.args);
  return applyDecorators(
    SetMetadata(APP_HTTP_ROUTE_KEY, {
      code: options.code,
      name: options.name,
      description: options.description ?? null,
      extra: options.extra ?? null,
      permission: options.permission,
    } satisfies ApiHttpRouteMeta),
    verb(...nestArgs),
  );
}

/** Catalogued GET — replaces bare `@Get`. */
export const ApiGet = (options: ApiHttpRouteOptions): MethodDecorator =>
  apiHttp(Get as NestPathDecorator, options);

/** Catalogued POST — replaces bare `@Post`. */
export const ApiPost = (options: ApiHttpRouteOptions): MethodDecorator =>
  apiHttp(Post as NestPathDecorator, options);

/** Catalogued PUT — replaces bare `@Put`. */
export const ApiPut = (options: ApiHttpRouteOptions): MethodDecorator =>
  apiHttp(Put as NestPathDecorator, options);

/** Catalogued PATCH — replaces bare `@Patch`. */
export const ApiPatch = (options: ApiHttpRouteOptions): MethodDecorator =>
  apiHttp(Patch as NestPathDecorator, options);

/** Catalogued DELETE — replaces bare `@Delete`. */
export const ApiDelete = (options: ApiHttpRouteOptions): MethodDecorator =>
  apiHttp(Delete as NestPathDecorator, options);
