import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';
import { FileInfo } from '../info/file-info.entity';
import { EmployeeMaster } from './employee-master.entity';

/** Layout/typography when rendering a signature on paper. */
export type EmployeeSignatureStyles = {
  nameFontSize: number;
  positionFontSize: number;
  imageScale: number;
  textAndImageGap: number;
};

/**
 * Employee e-signature asset.
 * Display when signing: image + `signatureName` + `signaturePosition`.
 * At most one row per employee may have `primary = true`.
 */
@Entity()
@Index(['employee'], {
  unique: true,
  where: '"primary" = true',
})
export class EmployeeSignatureMaster extends BaseEntityWithUuid {
  @ManyToOne(() => EmployeeMaster, { nullable: false })
  @JoinColumn()
  employee!: EmployeeMaster;

  /** Internal label for this signature record. */
  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;

  /**
   * Default signature for the employee.
   * Only one signature per employee may be primary.
   */
  @Column({ type: 'boolean', nullable: false, default: false })
  primary!: boolean;

  /** Signature image file. */
  @ManyToOne(() => FileInfo, { nullable: false })
  @JoinColumn()
  signatureImage!: FileInfo;

  /** Name printed under the signature when signing. */
  @Column({ type: 'varchar', length: 255, nullable: false })
  signatureName!: string;

  /** Position / title printed under the signature when signing. */
  @Column({ type: 'varchar', length: 255, nullable: false })
  signaturePosition!: string;

  /** Paper layout styles (font sizes, image scale, gaps). */
  @Column({ type: 'jsonb', nullable: true })
  signatureStyles?: EmployeeSignatureStyles | null;

  @Column({ type: 'varchar', length: 512, nullable: true })
  description?: string | null;
}
