import { TitleMaster } from '@app/entity/entities/master/title-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import type { CreateTitleDto } from './dto/create-title.dto';
import type { SetTitleActiveDto } from './dto/set-title-active.dto';
import type { UpdateTitleDto } from './dto/update-title.dto';

type PublicActor = {
  id: string;
  name: string;
};

@Injectable()
export class TitleService {
  constructor(
    @InjectRepository(TitleMaster)
    private readonly titleRepository: Repository<TitleMaster>,
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

    const qb = this.titleRepository
      .createQueryBuilder('title')
      .where('title.active = :active', { active })
      .orderBy('title.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.andWhere(
        `(title.name ILIKE :search ESCAPE '\\'
          OR title.code ILIKE :search ESCAPE '\\'
          OR COALESCE(title.description, '') ILIKE :search ESCAPE '\\')`,
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
    const title = await this.requireTitle(id);
    const actors = await this.resolveActors([title]);
    return this.toPublic(title, actors);
  }

  async create(dto: CreateTitleDto, actor?: AuthUser) {
    await this.assertNameAvailable(dto.name);
    await this.assertCodeAvailable(dto.code);

    const title = this.titleRepository.create({
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      createdBy: actor?.id,
      updatedBy: actor?.id,
    });
    const saved = await this.titleRepository.save(title);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  async update(id: string, dto: UpdateTitleDto, actor?: AuthUser) {
    const title = await this.requireTitle(id);
    if (dto.name !== undefined) {
      await this.assertNameAvailable(dto.name, id);
      title.name = dto.name;
    }
    if (dto.code !== undefined) {
      await this.assertCodeAvailable(dto.code, id);
      title.code = dto.code;
    }
    if (dto.description !== undefined) {
      title.description = dto.description;
    }
    title.updatedBy = actor?.id;
    const saved = await this.titleRepository.save(title);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  async setActive(id: string, dto: SetTitleActiveDto, actor?: AuthUser) {
    const title = await this.requireTitle(id);
    title.active = dto.active;
    title.updatedBy = actor?.id;
    const saved = await this.titleRepository.save(title);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  private async requireTitle(id: string) {
    const title = await this.titleRepository.findOne({ where: { id } });
    if (!title) {
      throw new NotFoundException('Title not found');
    }
    return title;
  }

  private async assertNameAvailable(name: string, excludeId?: string) {
    const existing = await this.titleRepository.findOne({ where: { name } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Title name already exists: ${name}`);
    }
  }

  private async assertCodeAvailable(code: string, excludeId?: string) {
    const existing = await this.titleRepository.findOne({ where: { code } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Title code already exists: ${code}`);
    }
  }

  private async resolveActors(
    titles: readonly TitleMaster[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        titles
          .flatMap((title) => [title.createdBy, title.updatedBy])
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

  private toPublic(title: TitleMaster, actors: Map<string, PublicActor>) {
    return {
      id: title.id,
      name: title.name,
      code: title.code,
      description: title.description ?? null,
      active: title.active,
      createdDate: title.createdDate,
      updatedDate: title.updatedDate,
      createdBy: title.createdBy
        ? (actors.get(title.createdBy) ?? {
            id: title.createdBy,
            name: title.createdBy,
          })
        : null,
      updatedBy: title.updatedBy
        ? (actors.get(title.updatedBy) ?? {
            id: title.updatedBy,
            name: title.updatedBy,
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
