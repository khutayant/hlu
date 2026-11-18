import { CountryMaster } from '@app/entity/entities/master/country-master.entity';
import { TownshipMaster } from '@app/entity/entities/master/township-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import type { CreateTownshipDto } from './dto/create-township.dto';
import type { SetTownshipActiveDto } from './dto/set-township-active.dto';
import { UpdateTownshipDto } from './dto/update-township.dto';

type PublicActor = {
  id: string;
  name: string;
};

@Injectable()
export class TownshipService {
  constructor(
    @InjectRepository(TownshipMaster)
    private readonly townshipRepository: Repository<TownshipMaster>,
    @InjectRepository(CountryMaster)
    private readonly countryRepository: Repository<CountryMaster>,
    @InjectRepository(UserMaster)
    private readonly userRepository: Repository<UserMaster>,
  ) {}

  async list(options?: {
    page?: number;
    limit?: number;
    q?: string;
    active?: boolean;
    countryId?: string;
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();
    const active = options?.active ?? true;
    const countryId = options?.countryId?.trim();

    const qb = this.townshipRepository
      .createQueryBuilder('township')
      .leftJoinAndSelect('township.country', 'country')
      .where('township.active = :active', { active })
      .orderBy('township.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (countryId) {
      qb.andWhere('country.id = :countryId', { countryId });
    }

    if (q) {
      qb.andWhere(
        `(township.name ILIKE :search ESCAPE '\\'
          OR township.code ILIKE :search ESCAPE '\\'
          OR COALESCE(township.focalPrefix, '') ILIKE :search ESCAPE '\\'
          OR COALESCE(township.description, '') ILIKE :search ESCAPE '\\')`,
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
    const township = await this.requireTownship(id);
    const actors = await this.resolveActors([township]);
    return this.toPublic(township, actors);
  }

  async create(dto: CreateTownshipDto, actor?: AuthUser) {
    const country = await this.requireCountry(dto.countryId);

    const existingCode = await this.townshipRepository.findOne({
      where: { code: dto.code },
    });
    if (existingCode) {
      throw new ConflictException(`Township code ${dto.code} already exists`);
    }

    const existingName = await this.townshipRepository.findOne({
      where: { country: { id: dto.countryId }, name: dto.name },
    });
    if (existingName) {
      throw new ConflictException(
        `Township name ${dto.name} already exists in this country`,
      );
    }

    const township = this.townshipRepository.create({
      name: dto.name,
      code: dto.code,
      country,
      focalPrefix: dto.focalPrefix,
      description: dto.description ?? null,
      createdBy: actor?.id,
      updatedBy: actor?.id,
    });
    const saved = await this.townshipRepository.save(township);
    return this.getById(saved.id);
  }

  async update(id: string, dto: UpdateTownshipDto, actor?: AuthUser) {
    const township = await this.requireTownship(id);
    const nextCountryId = dto.countryId ?? township.country.id;
    const nextName = dto.name ?? township.name;

    if (dto.countryId) {
      township.country = await this.requireCountry(dto.countryId);
    }
    if (dto.name !== undefined) {
      township.name = dto.name;
    }
    if (dto.focalPrefix !== undefined) {
      township.focalPrefix = dto.focalPrefix;
    }
    if (dto.description !== undefined) {
      township.description = dto.description;
    }

    if (dto.name !== undefined || dto.countryId !== undefined) {
      const clash = await this.townshipRepository.findOne({
        where: { country: { id: nextCountryId }, name: nextName },
      });
      if (clash && clash.id !== township.id) {
        throw new ConflictException(
          `Township name ${nextName} already exists in this country`,
        );
      }
    }

    township.updatedBy = actor?.id;
    await this.townshipRepository.save(township);
    return this.getById(township.id);
  }

  async setActive(id: string, dto: SetTownshipActiveDto, actor?: AuthUser) {
    const township = await this.requireTownship(id);
    township.active = dto.active;
    township.updatedBy = actor?.id;
    await this.townshipRepository.save(township);
    return this.getById(township.id);
  }

  private async requireCountry(id: string) {
    const country = await this.countryRepository.findOne({ where: { id } });
    if (!country || !country.active) {
      throw new NotFoundException('Country not found');
    }
    return country;
  }

  private async requireTownship(id: string) {
    const township = await this.townshipRepository.findOne({
      where: { id },
      relations: { country: true },
    });
    if (!township) {
      throw new NotFoundException('Township not found');
    }
    return township;
  }

  private async resolveActors(
    townships: readonly TownshipMaster[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        townships
          .flatMap((township) => [township.createdBy, township.updatedBy])
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

  private toPublic(
    township: TownshipMaster,
    actors: Map<string, PublicActor>,
  ) {
    return {
      id: township.id,
      name: township.name,
      code: township.code,
      focalPrefix: township.focalPrefix,
      description: township.description ?? null,
      countryId: township.country.id,
      country: township.country
        ? {
            id: township.country.id,
            name: township.country.name,
            code: township.country.code,
          }
        : null,
      active: township.active,
      createdDate: township.createdDate,
      updatedDate: township.updatedDate,
      createdBy: township.createdBy
        ? (actors.get(township.createdBy) ?? {
            id: township.createdBy,
            name: township.createdBy,
          })
        : null,
      updatedBy: township.updatedBy
        ? (actors.get(township.updatedBy) ?? {
            id: township.updatedBy,
            name: township.updatedBy,
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
