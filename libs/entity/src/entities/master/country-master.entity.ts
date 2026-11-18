import { Check, Column, Entity, OneToMany, Unique } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';
import { TownshipMaster } from './township-master.entity';

/**
 * Top-level geography master.
 * Later: {@link DistrictMaster} will sit between country and township.
 */
@Entity()
@Unique(['code'])
@Check(`"code" ~ '^[A-Z0-9_]+$'`)
export class CountryMaster extends BaseEntityWithUuid {
  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;

  /** `A-Z0-9_` only (e.g. `MM`). */
  @Column({ type: 'varchar', length: 64, nullable: false })
  code!: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description?: string | null;

  @OneToMany(() => TownshipMaster, (township) => township.country)
  townships?: TownshipMaster[];
}
