import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base';
import { MeetingMaster } from './meeting-master.entity';

/**
 * Allowance line for a meeting (labels + amounts for unit / quantity / total).
 */
@Entity()
export class MeetingAllowanceMaster extends BaseEntityWithUuid {
  @ManyToOne(() => MeetingMaster, { nullable: false })
  @JoinColumn()
  meeting!: MeetingMaster;

  /** Allowance name. */
  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;

  /** Display / report order within a meeting (1-based). */
  @Column({ type: 'int', nullable: false, default: 1 })
  sequenceNo!: number;

  /** When true, head-office attendees are excluded from this allowance. */
  @Column({ type: 'boolean', nullable: false, default: false })
  excludeHeadOffice!: boolean;

  /** Unit price: optional display label and amount. */
  @Column({ type: 'varchar', length: 125, nullable: true })
  unitPriceLabel?: string | null;
  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: false,
    default: 0,
  })
  unitPrice!: string;

  /** Quantity: optional display label and amount. */
  @Column({ type: 'varchar', length: 125, nullable: true })
  quantityLabel?: string | null;
  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: false,
    default: 0,
  })
  quantity!: string;

  /**
   * Total amount: optional display label and amount.
   * When `showTotalOnly` is true, report tables show only the total column.
   */
  @Column({ type: 'varchar', length: 125, nullable: true })
  totalAmountLabel?: string | null;
  @Column({
    type: 'numeric',
    precision: 18,
    scale: 2,
    nullable: false,
    default: 0,
  })
  totalAmount!: string;
  @Column({ type: 'boolean', nullable: false, default: false })
  showTotalOnly!: boolean;
}
