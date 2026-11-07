import { Column, Entity, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base.js';

@Entity()
@Unique(['name', 'deletedToken'])
@Unique(['code', 'deletedToken'])
export class UserRoleMaster extends BaseEntityWithUuid {
  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 64, nullable: false })
  code!: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description?: string | null;

  /** Soft-delete token; keeps name/code unique among active rows. */
  @Column({ type: 'varchar', length: 64, default: 'NA' })
  deletedToken!: string;
}
