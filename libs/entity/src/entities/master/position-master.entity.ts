import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';
import { CategoryMaster } from './category-master.entity';

/**
 * Job position master (e.g. `Midwife`, `Medical Officer`).
 * Not an honorific title.
 */
@Entity()
@Unique(['code'])
@Unique(['name'])
@Check(`"code" ~ '^[A-Z0-9_]+$'`)
export class PositionMaster extends BaseEntityWithUuid {
  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;

  /** `A-Z0-9_` only (e.g. `MIDWIFE`, `MEDICAL_OFFICER`). */
  @Column({ type: 'varchar', length: 64, nullable: false })
  code!: string;

  /** Optional position category (e.g. head-office). */
  @ManyToOne(() => CategoryMaster, { nullable: true })
  @JoinColumn()
  category?: CategoryMaster | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description?: string | null;
}
