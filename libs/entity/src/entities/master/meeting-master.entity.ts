import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';
import { ProjectMaster } from './project-master.entity';

/**
 * Meeting master (scheduled meetings with attendance later).
 */
@Entity()
@Unique(['meetingNo'])
@Check(`"meetingNo" ~ '^MT[0-9]{4}[0-9]{2}[0-9]{4}$'`)
export class MeetingMaster extends BaseEntityWithUuid {
  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;
  /**
   * Business meeting number (unique). Immutable after create.
   * Format: `MT` + `YYYY` + `MM` + 4 digits (e.g. `MT2026110001`).
   */
  @Column({ type: 'varchar', length: 16, nullable: false })
  meetingNo!: string;

  /** Meeting start (`timestamptz`). */
  @Column({ type: 'timestamptz', nullable: false })
  fromDate!: Date;
  /** Meeting end (`timestamptz`). */
  @Column({ type: 'timestamptz', nullable: false })
  toDate!: Date;

  @Column({ type: 'varchar', length: 256, nullable: true })
  place?: string | null;

  @ManyToOne(() => ProjectMaster, { nullable: true })
  @JoinColumn()
  project?: ProjectMaster | null;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description?: string | null;
}
