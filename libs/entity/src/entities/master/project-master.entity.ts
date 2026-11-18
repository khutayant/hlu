import { Check, Column, Entity, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';

/**
 * Project master (HR / clinic projects).
 * Later: BatchMaster and DoseMaster under this area.
 */
@Entity()
@Unique(['projectNo'])
@Check(`"projectNo" ~ '^PJ[0-9]{4}[0-9]{4}$'`)
export class ProjectMaster extends BaseEntityWithUuid {
  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;

  /**
   * Business project number (unique). Immutable after create.
   * Format: `PJ` + `YYYY` + 4 digits (e.g. `PJ20260001`).
   */
  @Column({ type: 'varchar', length: 16, nullable: false })
  projectNo!: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description?: string | null;
}
