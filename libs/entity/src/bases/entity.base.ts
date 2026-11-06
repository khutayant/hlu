import { PrimaryColumn } from 'typeorm';
import { v7 as uuidv7 } from 'uuid';
import { BaseEntityWithNoPrimary } from './entity-no-primary.base.js';

export abstract class BaseEntityWithUuid extends BaseEntityWithNoPrimary {
  @PrimaryColumn({ type: 'uuid' })
  id!: string;

  constructor() {
    super();

    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
