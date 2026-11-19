import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';
import { ProjectMaster } from './project-master.entity';
import { TownshipMaster } from './township-master.entity';

/**
 * Immunization session under a {@link ProjectMaster}
 * and {@link TownshipMaster} (e.g. a campaign round or session label).
 */
@Entity()
@Unique(['sessionNo'])
@Unique(['project', 'township', 'name'])
@Check(
  'CHK_immunization_session_sessionNo',
  `"sessionNo" ~ '^[A-Z0-9]{1,5}[0-9]{8}$'`,
)
export class ImmunizationSessionMaster extends BaseEntityWithUuid {
  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;

  /**
   * Business session number (unique). Immutable after create.
   * Format: township `focalPrefix` + `YYYY` + 4 digits (e.g. `GN20260001`).
   */
  @Column({ type: 'varchar', length: 16, nullable: false })
  sessionNo!: string;

  @ManyToOne(() => ProjectMaster, { nullable: false })
  @JoinColumn()
  project!: ProjectMaster;

  @ManyToOne(() => TownshipMaster, { nullable: false })
  @JoinColumn()
  township!: TownshipMaster;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description?: string | null;
}
