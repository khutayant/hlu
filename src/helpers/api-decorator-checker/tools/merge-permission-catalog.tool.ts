import type { AggregatedRoutePermission } from '../discovery/permission-catalog.discovery.js';
import { formatPermissionRef } from './format-permission.tool.js';
import {
  assertPermissionCode,
  formatSeedPermissionCode,
  throwIfPermissionCatalogConflicts,
  type PermissionCatalogConflictReport,
} from './permission-code.tool.js';

export type PermissionCatalogSeedRow = {
  name: string;
  subject: string;
  action: string;
  description: string;
  /** When set, must be the same code already used for this subject + action. */
  code?: string;
};

/**
 * Add seed rows to the route catalog.
 * A pair already owned by a route keeps that route's code.
 * A seed-only pair gets `PERM_{SUBJECT}_{ACTION}`.
 * Conflicts are thrown in memory, before any database write.
 */
export function mergeSeedPermissions(
  routes: readonly AggregatedRoutePermission[],
  seeds: readonly PermissionCatalogSeedRow[],
): AggregatedRoutePermission[] {
  const byCode = new Map<string, AggregatedRoutePermission>();
  const byPair = new Map<string, AggregatedRoutePermission>();
  const subjectAction: NonNullable<
    PermissionCatalogConflictReport['subjectAction']
  > = [];
  const codeConflicts: NonNullable<PermissionCatalogConflictReport['code']> =
    [];

  for (const route of routes) {
    const copy: AggregatedRoutePermission = {
      ...route,
      apiCodes: [...route.apiCodes],
      controllerPaths: [...route.controllerPaths],
    };
    byCode.set(copy.code, copy);
    byPair.set(formatPermissionRef(copy.subject, copy.action), copy);
  }

  for (const seed of seeds) {
    const pair = formatPermissionRef(seed.subject, seed.action);
    const held = byPair.get(pair);
    if (held) {
      if (seed.code && assertPermissionCode(seed.code) !== held.code) {
        subjectAction.push({
          subject: seed.subject,
          action: seed.action,
          codes: [held.code, assertPermissionCode(seed.code)].sort((a, b) =>
            a.localeCompare(b),
          ),
        });
        continue;
      }
      held.name = seed.name;
      if (!held.baseDescription && seed.description) {
        held.baseDescription = seed.description;
      }
      continue;
    }

    const code = seed.code
      ? assertPermissionCode(seed.code)
      : formatSeedPermissionCode(seed.subject, seed.action);
    const sameCode = byCode.get(code);
    if (
      sameCode &&
      (sameCode.subject !== seed.subject || sameCode.action !== seed.action)
    ) {
      codeConflicts.push({
        code,
        subjectActions: [
          { subject: sameCode.subject, action: sameCode.action },
          { subject: seed.subject, action: seed.action },
        ],
      });
      continue;
    }

    const entry: AggregatedRoutePermission = {
      code,
      name: seed.name,
      subject: seed.subject,
      action: seed.action,
      apiCodes: [],
      baseDescription: seed.description,
      controllerPaths: [],
    };
    byCode.set(code, entry);
    byPair.set(pair, entry);
  }

  throwIfPermissionCatalogConflicts({
    subjectAction,
    code: codeConflicts,
  });

  return [...byCode.values()].sort((a, b) => a.code.localeCompare(b.code));
}
