import { Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export abstract class BaseEntityWithNoPrimary {
  @CreateDateColumn({ type: 'timestamptz' })
  createdDate!: Date;

  @Column({ type: 'uuid', nullable: true })
  createdBy?: string | null;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedDate!: Date;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string | null;

  @Column({ type: 'boolean', default: true })
  active!: boolean;
}
