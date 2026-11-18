import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';
import { PermissionMaster } from '../master/permission-master.entity';
import { UserRoleMaster } from '../master/user-role-master.entity';

@Entity()
export class UserRolePermissionMapping extends BaseEntityWithUuid {
  @ManyToOne(() => UserRoleMaster, { nullable: false })
  @JoinColumn()
  userRole!: UserRoleMaster;

  @ManyToOne(
    () => PermissionMaster,
    (permission) => permission.userRoleMappings,
    { nullable: false },
  )
  @JoinColumn()
  permission!: PermissionMaster;

  @Column({ type: 'varchar', length: 256, nullable: true })
  remark?: string | null;
}
