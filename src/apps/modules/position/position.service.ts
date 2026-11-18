import { PositionMaster } from '@app/entity/entities/master/position-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import type { CreatePositionDto } from './dto/create-position.dto';
import type { SetPositionActiveDto } from './dto/set-position-active.dto';
import type { UpdatePositionDto } from './dto/update-position.dto';

type PublicActor = {
  id: string;
  name: string;
};

@Injectable()
export class PositionService {
  constructor(
    @InjectRepository(PositionMaster)
    private readonly positionRepository: Repository<PositionMaster>,
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

    const qb = this.positionRepository
      .createQueryBuilder('position')
      .where('position.active = :active', { active })
      .orderBy('position.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.andWhere(
        `(position.name ILIKE :search ESCAPE '\\'
          OR position.code ILIKE :search ESCAPE '\\'
          OR COALESCE(position.description, '') ILIKE :search ESCAPE '\\')`,
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
    const position = await this.requirePosition(id);
    const actors = await this.resolveActors([position]);
    return this.toPublic(position, actors);
  }

  async create(dto: CreatePositionDto, actor?: AuthUser) {
    await this.assertNameAvailable(dto.name);
    await this.assertCodeAvailable(dto.code);

    const position = this.positionRepository.create({
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      createdBy: actor?.id,
      updatedBy: actor?.id,
    });
    const saved = await this.positionRepository.save(position);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  async update(id: string, dto: UpdatePositionDto, actor?: AuthUser) {
    const position = await this.requirePosition(id);
    if (dto.name !== undefined) {
      await this.assertNameAvailable(dto.name, id);
      position.name = dto.name;
    }
    if (dto.code !== undefined) {
      await this.assertCodeAvailable(dto.code, id);
      position.code = dto.code;
    }
    if (dto.description !== undefined) {
      position.description = dto.description;
    }
    position.updatedBy = actor?.id;
    const saved = await this.positionRepository.save(position);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  async setActive(id: string, dto: SetPositionActiveDto, actor?: AuthUser) {
    const position = await this.requirePosition(id);
    position.active = dto.active;
    position.updatedBy = actor?.id;
    const saved = await this.positionRepository.save(position);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  private async requirePosition(id: string) {
    const position = await this.positionRepository.findOne({ where: { id } });
    if (!position) {
      throw new NotFoundException('Position not found');
    }
    return position;
  }

  private async assertNameAvailable(name: string, excludeId?: string) {
    const existing = await this.positionRepository.findOne({ where: { name } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Position name already exists: ${name}`);
    }
  }

  private async assertCodeAvailable(code: string, excludeId?: string) {
    const existing = await this.positionRepository.findOne({ where: { code } });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Position code already exists: ${code}`);
    }
  }

  private async resolveActors(
    positions: readonly PositionMaster[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        positions
          .flatMap((position) => [position.createdBy, position.updatedBy])
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

  private toPublic(position: PositionMaster, actors: Map<string, PublicActor>) {
    return {
      id: position.id,
      name: position.name,
      code: position.code,
      description: position.description ?? null,
      active: position.active,
      createdDate: position.createdDate,
      updatedDate: position.updatedDate,
      createdBy: position.createdBy
        ? (actors.get(position.createdBy) ?? {
            id: position.createdBy,
            name: position.createdBy,
          })
        : null,
      updatedBy: position.updatedBy
        ? (actors.get(position.updatedBy) ?? {
            id: position.updatedBy,
            name: position.updatedBy,
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
