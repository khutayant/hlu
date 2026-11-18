import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  Unique,
} from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';
import { GenderEnum } from '../../enums/gender.enum';
import { FileInfo } from '../info/file-info.entity';
import { PositionMaster } from './position-master.entity';
import { TitleMaster } from './title-master.entity';
import { TownshipMaster } from './township-master.entity';
import { UserMaster } from './user-master.entity';

@Entity()
@Unique(['employeeNo'])
@Unique(['focalNo'])
@Check(`"focalNo" ~ '^[A-Z]+[0-9]+$'`)
@Index(['email'])
export class EmployeeMaster extends BaseEntityWithUuid {
  /**
   * Business employee number (unique). Immutable after create.
   * Auto format: `H` + 4 digits (e.g. `H0001`) — no year/month/day.
   * Manual values allowed only when provided on create.
   */
  @Column({ type: 'varchar', length: 64 })
  employeeNo!: string;
  /**
   * Focal number (unique). Manual; editable.
   * Pattern: one or more `A–Z` then one or more `0–9` only (e.g. `A91`, `M003`).
   * No interleaved mixture (`A9Z1` invalid). Max length 9. Stored uppercase.
   */
  @Column({ type: 'varchar', length: 9 })
  focalNo!: string;

  /** Honorific title (`Daw`, `U`, `Dr.`, …). */
  @ManyToOne(() => TitleMaster, { nullable: true })
  @JoinColumn()
  title?: TitleMaster | null;

  /** Full display name (Myanmar naming — not split into first/last). */
  @Column({ type: 'varchar', length: 255 })
  displayName!: string;

  @Column({ type: 'varchar', length: 16 })
  gender!: GenderEnum;

  /** Township (`TownshipMaster`). */
  @ManyToOne(() => TownshipMaster, { nullable: false })
  @JoinColumn()
  township!: TownshipMaster;

  /** Job position (`PositionMaster`). */
  @ManyToOne(() => PositionMaster, { nullable: false })
  @JoinColumn()
  position!: PositionMaster;

  /**
   * Work experience (mandatory text for now, e.g. years or summary).
   * Later: managed via a dedicated experience model — not now.
   */
  @Column({ type: 'varchar', length: 255 })
  experience!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string | null;
  @Column({ type: 'varchar', length: 32, nullable: true })
  phone?: string | null;

  @Column({ type: 'date', nullable: true })
  hireDate?: string | null;
  @Column({ type: 'date', nullable: true })
  endDate?: string | null;

  /** HR profile avatar (`FileInfo`). */
  @ManyToOne(() => FileInfo, { nullable: true })
  @JoinColumn()
  profileImage?: FileInfo | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  remark?: string | null;

  /**
   * Optional login account. FK lives on this table (`userId`);
   * inverse is {@link UserMaster.employee}.
   */
  @OneToOne(() => UserMaster, (user) => user.employee, { nullable: true })
  @JoinColumn()
  user?: UserMaster | null;
}
