import { Check, Column, Entity, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';

/**
 * Honorific / courtesy title master (e.g. `Daw`, `U`, `Dr.`).
 * Not a job position.
 */
@Entity()
@Unique(['code'])
@Unique(['name'])
@Check(`"code" ~ '^[A-Z0-9_]+$'`)
export class TitleMaster extends BaseEntityWithUuid {
  @Column({ type: 'varchar', length: 64, nullable: false })
  name!: string;

  /** `A-Z0-9_` only (e.g. `BURMESE_DAW`, `DOCTOR`). */
  @Column({ type: 'varchar', length: 64, nullable: false })
  code!: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description?: string | null;
}
