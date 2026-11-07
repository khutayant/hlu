import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import {
  APP_CONTROLLER_KEY,
  APP_HTTP_ROUTE_KEY,
  type ApiControllerMeta,
  type ApiHttpRouteMeta,
} from '../../../decorators/api.decorator.js';
import {
  formatPermissionName,
  formatPermissionRef,
} from '../tools/format-permission.tool.js';
import {
  resolveRoutePermissionCode,
  throwIfPermissionCatalogConflicts,
} from '../tools/permission-code.tool.js';

/** One `@Api*` route contributing to a permission's attached API list. */
export type DiscoveredRoutePermission = {
  /** Permission maintenance code (`permission.code` or `PERM_` + endpoint code). */
  code: string;
  apiCode: string;
  subject: string;
  action: string;
  /** Optional human text from `@Api*` `permission.description`. */
  permissionDescription: string | null;
  /** Nest controller mount path. */
  controllerPath: string;
};

/** Aggregated permission row derived from discovered routes. */
export type AggregatedRoutePermission = {
  code: string;
  name: string;
  subject: string;
  action: string;
  apiCodes: string[];
  /** First non-empty `permission.description` among routes, if any. */
  baseDescription: string | null;
  controllerPaths: string[];
};

/**
 * Scan Nest controllers for `@Api*` `permission` metadata.
 */
export function discoverAppRoutePermissions(
  discovery: DiscoveryService,
  metadataScanner: MetadataScanner,
  reflector: Reflector,
): DiscoveredRoutePermission[] {
  const items: DiscoveredRoutePermission[] = [];

  for (const wrapper of discovery.getControllers()) {
    const controllerClass = resolveControllerClass(wrapper);
    if (!controllerClass) {
      continue;
    }

    const controllerMeta = reflector.get<ApiControllerMeta | undefined>(
      APP_CONTROLLER_KEY,
      controllerClass,
    );
    if (!controllerMeta?.code?.trim()) {
      continue;
    }

    const controllerPath = formatControllerPath(
      Reflect.getMetadata(PATH_METADATA, controllerClass),
    );

    const prototype = controllerClass.prototype as object;
    const methodNames = metadataScanner.getAllMethodNames(prototype);

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

      const meta = reflector.get<ApiHttpRouteMeta | undefined>(
        APP_HTTP_ROUTE_KEY,
        handler,
      );
      if (!meta?.code?.trim()) {
        continue;
      }
      const permission = meta.permission;
      if (
        !permission?.code?.trim() ||
        !permission.subject?.trim() ||
        !permission.action?.trim()
      ) {
        continue;
      }

      const subject = permission.subject.trim();
      const action = String(permission.action).trim();
      items.push({
        code: resolveRoutePermissionCode(permission.code),
        apiCode: meta.code.trim(),
        subject,
        action,
        permissionDescription:
          typeof permission.description === 'string' &&
          permission.description.trim()
            ? permission.description.trim()
            : null,
        controllerPath,
      });
    }
  }

  return items.sort((a, b) => a.apiCode.localeCompare(b.apiCode));
}

/**
 * Group discovered routes by permission `code`.
 * Compared in memory only: one code ↔ one subject + action. Conflicts throw
 * before any database write.
 */
export function aggregateRoutePermissions(
  items: readonly DiscoveredRoutePermission[],
): AggregatedRoutePermission[] {
  const byCode = new Map<string, AggregatedRoutePermission>();
  const codesByPair = new Map<
    string,
    { subject: string; action: string; codes: Set<string> }
  >();
  const pairsByCode = new Map<
    string,
    Map<string, { subject: string; action: string }>
  >();

  for (const item of items) {
    const pair = formatPermissionRef(item.subject, item.action);
    let pairCodes = codesByPair.get(pair);
    if (!pairCodes) {
      pairCodes = {
        subject: item.subject,
        action: item.action,
        codes: new Set(),
      };
      codesByPair.set(pair, pairCodes);
    }
    pairCodes.codes.add(item.code);

    let codePairs = pairsByCode.get(item.code);
    if (!codePairs) {
      codePairs = new Map();
      pairsByCode.set(item.code, codePairs);
    }
    codePairs.set(pair, { subject: item.subject, action: item.action });

    if (pairCodes.codes.size > 1 || codePairs.size > 1) {
      continue;
    }

    let agg = byCode.get(item.code);
    if (!agg) {
      agg = {
        code: item.code,
        name: formatPermissionName(item.action, item.subject),
        subject: item.subject,
        action: item.action,
        apiCodes: [],
        baseDescription: null,
        controllerPaths: [],
      };
      byCode.set(item.code, agg);
    }
    if (!agg.apiCodes.includes(item.apiCode)) {
      agg.apiCodes.push(item.apiCode);
    }
    if (!agg.baseDescription && item.permissionDescription) {
      agg.baseDescription = item.permissionDescription;
    }
    if (
      item.controllerPath &&
      !agg.controllerPaths.includes(item.controllerPath)
    ) {
      agg.controllerPaths.push(item.controllerPath);
    }
  }

  throwIfPermissionCatalogConflicts({
    subjectAction: [...codesByPair.values()]
      .filter((entry) => entry.codes.size > 1)
      .map((entry) => ({
        subject: entry.subject,
        action: entry.action,
        codes: [...entry.codes].sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) =>
        formatPermissionRef(a.subject, a.action).localeCompare(
          formatPermissionRef(b.subject, b.action),
        ),
      ),
    code: [...pairsByCode.entries()]
      .filter(([, pairs]) => pairs.size > 1)
      .map(([code, pairs]) => ({
        code,
        subjectActions: [...pairs.values()].sort((a, b) =>
          formatPermissionRef(a.subject, a.action).localeCompare(
            formatPermissionRef(b.subject, b.action),
          ),
        ),
      }))
      .sort((a, b) => a.code.localeCompare(b.code)),
  });

  for (const agg of byCode.values()) {
    agg.apiCodes.sort((a, b) => a.localeCompare(b));
  }

  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}

function resolveControllerClass(
  wrapper: InstanceWrapper,
): (new (...args: unknown[]) => unknown) | null {
  const metatype = wrapper.metatype;
  if (typeof metatype !== 'function' || !metatype.name) {
    return null;
  }
  return metatype as new (...args: unknown[]) => unknown;
}

function formatControllerPath(path: unknown): string {
  if (typeof path === 'string') {
    return path.replace(/^\/+/, '');
  }
  if (Array.isArray(path) && typeof path[0] === 'string') {
    return path[0].replace(/^\/+/, '');
  }
  return '';
}
