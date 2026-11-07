import { Check, Column, Entity, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base.js';

@Entity()
@Unique(['code'])
@Check(`"code" ~ '^[A-Z0-9_]+$'`)
export class SessionMaster extends BaseEntityWithUuid {
  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;

  /** `A-Z0-9_` only. Must match `/^[A-Z0-9_]+$/`. */
  @Column({ type: 'varchar', length: 64, nullable: false })
  code!: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description?: string | null;

  @Column({ type: 'timestamptz', nullable: false })
  fromDate!: Date;

  @Column({ type: 'timestamptz', nullable: false })
  toDate!: Date;
}
