import { Check, Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';
import { CountryMaster } from './country-master.entity';

/**
 * Township under a country (for now).
 * Later: add {@link DistrictMaster} between country and township
 * (`districtId`); keep or migrate country relation then.
 */
@Entity()
@Unique(['code'])
@Unique(['country', 'name'])
@Check(`"code" ~ '^[A-Z0-9_]+$'`)
@Check(`"focalPrefix" ~ '^[A-Z0-9]+$'`)
export class TownshipMaster extends BaseEntityWithUuid {
  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;

  /** `A-Z0-9_` only (e.g. `GN` for Gangaw North). */
  @Column({ type: 'varchar', length: 64, nullable: false })
  code!: string;

  /**
   * Focal-number prefix used by HR imports (e.g. `GN`, `M`).
   * Required; `A-Z0-9` only; max 5; stored uppercase; not unique.
   */
  @Column({ type: 'varchar', length: 5, nullable: false })
  focalPrefix!: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description?: string | null;

  /** Parent country until district master exists. */
  @ManyToOne(() => CountryMaster, { nullable: false })
  @JoinColumn()
  country!: CountryMaster;
}
