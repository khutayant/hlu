import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { v7 as uuidv7 } from 'uuid';

@Entity()
export class CodeGenInfo {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  @Column({ type: 'varchar', nullable: false })
  type!: string;

  @Column({ type: 'int', nullable: false })
  year!: number;

  @Column({ type: 'int', nullable: false })
  month!: number;

  @Column({ type: 'int', nullable: false })
  day!: number;

  @Column({ type: 'int', nullable: false })
  number!: number;

  @Column({ type: 'varchar', length: 48, nullable: true })
  prefix?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdDate!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedDate!: Date;

  constructor() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
