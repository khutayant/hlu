import { Column, Entity, Index, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base.js';
import { UserRoleEnum } from '../../enums/user-role.enum.js';
import { FileInfo } from '../info/file-info.entity.js';

@Entity()
@Unique(['keycloakId'])
@Unique(['username'])
@Index(['email'])
export class UserMaster extends BaseEntityWithUuid {
  @Column({ type: 'varchar', length: 64 })
  keycloakId!: string;

  @Column({ type: 'varchar', length: 100 })
  username!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;

  @Column({ type: 'boolean', default: false })
  emailVerified!: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  firstName?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName?: string | null;

  @Column({
    type: 'varchar',
    length: 32,
    default: UserRoleEnum.STAFF,
  })
  role!: UserRoleEnum;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date | null;

  /** Account-owner profile avatar (`FileInfo`). */
  @ManyToOne(() => FileInfo, { nullable: true })
  @JoinColumn()
  profileImage?: FileInfo | null;

  /** Account-owner cover image (`FileInfo`). */
  @ManyToOne(() => FileInfo, { nullable: true })
  @JoinColumn()
  coverImage?: FileInfo | null;
}
