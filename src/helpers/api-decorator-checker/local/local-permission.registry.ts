import { Injectable } from '@nestjs/common';
import type {
  AggregatedRoutePermission,
  DiscoveredRoutePermission,
} from '../discovery/permission-catalog.discovery.js';
import { aggregateRoutePermissions } from '../discovery/permission-catalog.discovery.js';

/**
 * Process-local route→permission attachments (from `@Api*` `permission`).
 */
@Injectable()
export class LocalPermissionRegistry {
  private items: DiscoveredRoutePermission[] = [];
  private ready = false;

  setAll(items: DiscoveredRoutePermission[]): void {
    this.items = [...items];
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready;
  }

  size(): number {
    return this.items.length;
  }

  list(): DiscoveredRoutePermission[] {
    return [...this.items];
  }

  aggregate(): AggregatedRoutePermission[] {
    return aggregateRoutePermissions(this.items);
  }
}
