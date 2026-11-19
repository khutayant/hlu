import { CategoryMaster } from '@app/entity/entities/master/category-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import type { CreateCategoryDto } from './dto/create-category.dto';
import type { SetCategoryActiveDto } from './dto/set-category-active.dto';
import type { UpdateCategoryDto } from './dto/update-category.dto';

type PublicActor = {
  id: string;
  name: string;
};

@Injectable()
export class CategoryService {
  constructor(
    @InjectRepository(CategoryMaster)
    private readonly categoryRepository: Repository<CategoryMaster>,
    @InjectRepository(UserMaster)
    private readonly userRepository: Repository<UserMaster>,
  ) {}

  async list(options?: {
    page?: number;
    limit?: number;
    q?: string;
    active?: boolean;
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();
    const active = options?.active ?? true;

    const qb = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parentCategory', 'parentCategory')
      .where('category.active = :active', { active })
      .orderBy('category.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.andWhere(
        `(category.name ILIKE :search ESCAPE '\\'
          OR category.code ILIKE :search ESCAPE '\\'
          OR COALESCE(category.description, '') ILIKE :search ESCAPE '\\'
          OR COALESCE(parentCategory.name, '') ILIKE :search ESCAPE '\\'
          OR COALESCE(parentCategory.code, '') ILIKE :search ESCAPE '\\')`,
        { search: this.toIlikeContainsPattern(q) },
      );
    }

    const [items, total] = await qb.getManyAndCount();
    const actors = await this.resolveActors(items);
    return {
      items: items.map((item) => this.toPublic(item, actors)),
      total,
      page,
      limit,
      active,
    };
  }

  async getById(id: string) {
    const category = await this.requireCategory(id, true);
    const actors = await this.resolveActors([category]);
    return this.toPublic(category, actors);
  }

  async create(dto: CreateCategoryDto, actor?: AuthUser) {
    await this.assertCodeAvailable(dto.code);
    const parent = await this.resolveParent(dto.parentCategoryId);

    const category = this.categoryRepository.create({
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      isPosting: dto.isPosting ?? false,
      parentCategory: parent,
      createdBy: actor?.id,
      updatedBy: actor?.id,
    });
    const saved = await this.categoryRepository.save(category);
    return this.getById(saved.id);
  }

  async update(id: string, dto: UpdateCategoryDto, actor?: AuthUser) {
    const category = await this.requireCategory(id, true);
    if (dto.name !== undefined) {
      category.name = dto.name;
    }
    if (dto.code !== undefined) {
      await this.assertCodeAvailable(dto.code, id);
      category.code = dto.code;
    }
    if (dto.description !== undefined) {
      category.description = dto.description;
    }
    if (dto.isPosting !== undefined) {
      category.isPosting = dto.isPosting;
    }
    if (dto.parentCategoryId !== undefined) {
      if (dto.parentCategoryId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }
      category.parentCategory = await this.resolveParent(dto.parentCategoryId);
      if (category.parentCategory) {
        await this.assertNotDescendant(id, category.parentCategory.id);
      }
    }
    category.updatedBy = actor?.id;
    const saved = await this.categoryRepository.save(category);
    return this.getById(saved.id);
  }

  async setActive(id: string, dto: SetCategoryActiveDto, actor?: AuthUser) {
    const category = await this.requireCategory(id, true);
    category.active = dto.active;
    category.updatedBy = actor?.id;
    const saved = await this.categoryRepository.save(category);
    return this.getById(saved.id);
  }

  private async requireCategory(id: string, withParent = false) {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: withParent ? { parentCategory: true } : undefined,
    });
    if (!category) {
      throw new NotFoundException('Category not found');
    }
    return category;
  }

  private async resolveParent(parentCategoryId?: string | null) {
    if (!parentCategoryId) {
      return null;
    }
    const parent = await this.categoryRepository.findOne({
      where: { id: parentCategoryId, active: true },
    });
    if (!parent) {
      throw new NotFoundException('Parent category not found');
    }
    return parent;
  }

  /** Reject parent that is the category itself or one of its descendants. */
  private async assertNotDescendant(categoryId: string, parentId: string) {
    const children = await this.categoryRepository.find({
      where: { parentCategory: { id: categoryId } },
      select: { id: true },
    });
    const queue = children.map((child) => child.id);
    const seen = new Set<string>(queue);
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === parentId) {
        throw new BadRequestException(
          'Parent category cannot be a descendant of this category',
        );
      }
      const next = await this.categoryRepository.find({
        where: { parentCategory: { id: current } },
        select: { id: true },
      });
      for (const child of next) {
        if (!seen.has(child.id)) {
          seen.add(child.id);
          queue.push(child.id);
        }
      }
    }
  }

  private async assertCodeAvailable(code: string, excludeId?: string) {
    const existing = await this.categoryRepository.findOne({ where: { code } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Category code already exists: ${code}`);
    }
  }

  private async resolveActors(
    categories: readonly CategoryMaster[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        categories
          .flatMap((category) => [category.createdBy, category.updatedBy])
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const map = new Map<string, PublicActor>();
    if (ids.length === 0) {
      return map;
    }

    const users = await this.userRepository.find({
      where: { id: In(ids) },
    });

    for (const user of users) {
      const fullName = [user.firstName, user.lastName]
        .filter(Boolean)
        .join(' ')
        .trim();
      map.set(user.id, {
        id: user.id,
        name: fullName || user.username,
      });
    }

    return map;
  }

  private toPublic(category: CategoryMaster, actors: Map<string, PublicActor>) {
    const parent = category.parentCategory ?? null;
    return {
      id: category.id,
      name: category.name,
      code: category.code,
      description: category.description ?? null,
      isPosting: category.isPosting,
      parentCategoryId: parent?.id ?? null,
      parentCategory: parent
        ? {
            id: parent.id,
            name: parent.name,
            code: parent.code,
          }
        : null,
      active: category.active,
      createdDate: category.createdDate,
      updatedDate: category.updatedDate,
      createdBy: category.createdBy
        ? (actors.get(category.createdBy) ?? {
            id: category.createdBy,
            name: category.createdBy,
          })
        : null,
      updatedBy: category.updatedBy
        ? (actors.get(category.updatedBy) ?? {
            id: category.updatedBy,
            name: category.updatedBy,
          })
        : null,
    };
  }

  private toIlikeContainsPattern(raw: string): string {
    const escaped = raw
      .replaceAll('\\', '\\\\')
      .replaceAll('%', '\\%')
      .replaceAll('_', '\\_');
    return `%${escaped}%`;
  }
}
