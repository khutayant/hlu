import { Column, Entity, OneToMany, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base.js';
import { UserRolePermissionMapping } from '../mapping/user-role-permission-mapping.entity.js';

@Entity()
@Unique(['code'])
export class PermissionMaster extends BaseEntityWithUuid {
  @Column({ type: 'varchar', length: 126, nullable: false })
  name!: string;

  /**
   * Maintenance key (`A-Z0-9_`). Catalog updates match on this, not subject + action.
   * Must match `/^[A-Z0-9_]+$/`.
   */
  @Column({ type: 'varchar', length: 256, nullable: false })
  code!: string;

  /**
   * RBAC subject (`a-z0-9-`, max 64). See `PERMISSION_SUBJECT`.
   */
  @Column({ type: 'varchar', length: 64, nullable: false })
  subject!: string;

  /**
   * RBAC action (`a-z0-9-`, max 64). See `PERMISSION_ACTION`.
   */
  @Column({ type: 'varchar', length: 64, nullable: false })
  action!: string;

  /** Human description only (no attached API code list). */
  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @OneToMany(
    () => UserRolePermissionMapping,
    (mapping) => mapping.permission,
  )
  userRoleMappings?: UserRolePermissionMapping[] | null;
}
