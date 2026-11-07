import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base.js';
import { CategoryMaster } from '../master/category-master.entity.js';

@Entity()
export class FileInfo extends BaseEntityWithUuid {
  @ManyToOne(() => CategoryMaster, { nullable: false })
  @JoinColumn()
  category!: CategoryMaster;

  /** [Prefix → FN][YYYY][MM][4 digits] */
  @Column({ type: 'varchar', length: 48, nullable: false })
  fileNo!: string;

  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 125, nullable: false })
  mimeType!: string;

  @Column({ type: 'bigint', nullable: false })
  size!: number;

  /** Storage file name, use UUID v4 to generate */
  @Column({ type: 'uuid', nullable: false })
  uuidName!: string;

  /** User SHA-256 checksum of the file */
  @Column({ type: 'varchar', length: 64, nullable: false })
  checksum!: string;

  /** Storage subfolder under uploads, `YYYY-MM` of upload date. */
  @Column({ type: 'varchar', length: 7, nullable: false })
  folder!: string;

  @Column({ type: 'varchar', length: 512, nullable: true })
  description?: string | null;
}
