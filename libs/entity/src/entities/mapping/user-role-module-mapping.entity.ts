import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';
import { ModuleMaster } from '../master/module-master.entity';
import { UserRoleMaster } from '../master/user-role-master.entity';

@Entity()
export class UserRoleModuleMapping extends BaseEntityWithUuid {
  @ManyToOne(() => UserRoleMaster, { nullable: false })
  @JoinColumn()
  userRole!: UserRoleMaster;

  @ManyToOne(
    () => ModuleMaster,
    (module) => module.userRoleMappings,
    { nullable: false },
  )
  @JoinColumn()
  module!: ModuleMaster;

  @Column({ type: 'varchar', length: 256, nullable: true })
  remark?: string | null;
}
