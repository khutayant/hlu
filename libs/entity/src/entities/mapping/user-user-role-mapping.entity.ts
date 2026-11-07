import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base.js';
import { UserMaster } from '../master/user-master.entity.js';
import { UserRoleMaster } from '../master/user-role-master.entity.js';

@Entity()
@Unique(['user', 'userRole', 'deletedToken'])
export class UserUserRoleMapping extends BaseEntityWithUuid {
  @ManyToOne(() => UserMaster, { nullable: false })
  @JoinColumn()
  user!: UserMaster;

  @ManyToOne(() => UserRoleMaster, { nullable: false })
  @JoinColumn()
  userRole!: UserRoleMaster;

  /** Soft-delete token; keeps user+role unique among active rows. */
  @Column({ type: 'varchar', length: 64, default: 'NA' })
  deletedToken!: string;
}
