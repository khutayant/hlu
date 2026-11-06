import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseEntityWithUuid } from '../../bases/entity.base.js';

@Entity()
export class CategoryMaster extends BaseEntityWithUuid {
  @Column({ type: 'varchar', length: 125, nullable: false })
  name!: string;

  @Column({ type: 'varchar', length: 64, nullable: false })
  code!: string;

  @Column({ type: 'varchar', length: 256, nullable: true })
  description?: string | null;

  @Column({ type: 'boolean', nullable: false })
  isPosting!: boolean;

  @ManyToOne(
    () => CategoryMaster,
    (parentCategory) => parentCategory.childCategories,
    { nullable: true },
  )
  @JoinColumn()
  parentCategory?: CategoryMaster | null;

  @OneToMany(
    () => CategoryMaster,
    (childCategory) => childCategory.parentCategory,
    { nullable: true },
  )
  childCategories?: CategoryMaster[] | null;
}
