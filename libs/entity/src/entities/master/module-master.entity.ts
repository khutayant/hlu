import { Column, Entity, JoinColumn, ManyToOne, OneToMany, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base.js';
import { UserRoleModuleMapping } from '../mapping/user-role-module-mapping.entity.js';

@Entity()
@Unique(['code'])
export class ModuleMaster extends BaseEntityWithUuid {
  // item info group
  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 64, nullable: false })
  code!: string;

  @Column({ type: 'int', nullable: true, default: 1 })
  sequenceNo?: number | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description?: string | null;

  // type and module
  @Column({ type: 'boolean', nullable: false })
  isGroup!: boolean;

  @ManyToOne(
    () => ModuleMaster,
    (parentModule) => parentModule.childModules,
    { nullable: true },
  )
  @JoinColumn()
  parentModule?: ModuleMaster | null;

  // child modules
  @OneToMany(
    () => ModuleMaster,
    (childModule) => childModule.parentModule,
    { nullable: true },
  )
  childModules?: ModuleMaster[] | null;

  @OneToMany(
    () => UserRoleModuleMapping,
    (mapping) => mapping.module,
  )
  userRoleMappings?: UserRoleModuleMapping[] | null;
}
