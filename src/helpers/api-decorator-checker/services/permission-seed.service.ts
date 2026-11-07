import { PermissionMaster } from '@app/entity';
import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnModuleDestroy,
} from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import { PERMISSION_SEED_ROWS } from '../../../resources/data/permissions/seed/permission-seed.data.js';
import {
  aggregateRoutePermissions,
  discoverAppRoutePermissions,
} from '../discovery/permission-catalog.discovery.js';
import { AdminRelationshipSeedService } from '../seed-admin/admin-relationship-seed.service.js';
import {
  buildPermissionDescription,
} from '../tools/format-permission.tool.js';
import { mergeSeedPermissions } from '../tools/merge-permission-catalog.tool.js';

const STARTUP_DELAY_MS = 3_000;

/**
 * After app startup (3s delay), upsert `@Api*` permissions into `PermissionMaster`.
 * Catalog conflicts are checked via `aggregateRoutePermissions` + `mergeSeedPermissions`
 * before any write.
 *
 * On success, runs {@link AdminRelationshipSeedService} so ADMIN links exist only after
 * module / user-role / permission rows are already seeded.
 */
@Injectable()
export class PermissionSeedService
  implements OnApplicationBootstrap, OnModuleDestroy
{
  private readonly logger = new Logger(PermissionSeedService.name);
  private timer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor(
    private readonly discovery: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
    @InjectRepository(PermissionMaster)
    private readonly permissionRepository: Repository<PermissionMaster>,
    private readonly adminRelationshipSeed: AdminRelationshipSeedService,
  ) {}

  onApplicationBootstrap(): void {
    this.timer = setTimeout(() => {
      void this.seed();
    }, STARTUP_DELAY_MS);
  }

  onModuleDestroy(): void {
    this.destroyed = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  async seed(): Promise<void> {
    if (this.destroyed) {
      return;
    }

    try {
      const discovered = discoverAppRoutePermissions(
        this.discovery,
        this.metadataScanner,
        this.reflector,
      );
      const routes = aggregateRoutePermissions(discovered);
      const rows = mergeSeedPermissions(
        routes,
        PERMISSION_SEED_ROWS.map((row) => ({
          code: row.code,
          subject: row.subject,
          action: row.action,
          name: row.name,
          description: row.description,
        })),
      );

      let created = 0;
      let updated = 0;

      for (const row of rows) {
        const description =
          buildPermissionDescription({
            base: row.baseDescription,
          }) || null;

        const existing = await this.permissionRepository.findOne({
          where: { code: row.code, active: true },
        });

        if (existing) {
          existing.name = row.name;
          existing.subject = row.subject;
          existing.action = row.action;
          existing.description = description;
          existing.active = true;
          await this.permissionRepository.save(existing);
          updated += 1;
          continue;
        }

        await this.permissionRepository.save(
          this.permissionRepository.create({
            code: row.code,
            name: row.name,
            subject: row.subject,
            action: row.action,
            description,
            active: true,
          }),
        );
        created += 1;
      }

      this.logger.log(
        `Permission seed complete: discovered=${discovered.length} codes=${rows.length} created=${created} updated=${updated}`,
      );
    } catch (error) {
      this.logger.error(
        'Permission seed failed',
        error instanceof Error ? error.stack : String(error),
      );
      return;
    }

    if (this.destroyed) {
      return;
    }

    try {
      await this.adminRelationshipSeed.seed();
    } catch (error) {
      this.logger.error(
        'Admin relationship seed failed',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
