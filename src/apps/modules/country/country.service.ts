import { CountryMaster } from '@app/entity/entities/master/country-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import type { CreateCountryDto } from './dto/create-country.dto';
import type { SetCountryActiveDto } from './dto/set-country-active.dto';
import type { UpdateCountryDto } from './dto/update-country.dto';

type PublicActor = {
  id: string;
  name: string;
};

@Injectable()
export class CountryService {
  constructor(
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
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();
    const active = options?.active ?? true;

    const qb = this.countryRepository
      .createQueryBuilder('country')
      .where('country.active = :active', { active })
      .orderBy('country.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.andWhere(
        `(country.name ILIKE :search ESCAPE '\\'
          OR country.code ILIKE :search ESCAPE '\\'
          OR COALESCE(country.description, '') ILIKE :search ESCAPE '\\')`,
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
    const country = await this.requireCountry(id);
    const actors = await this.resolveActors([country]);
    return this.toPublic(country, actors);
  }

  async create(dto: CreateCountryDto, actor?: AuthUser) {
    const existing = await this.countryRepository.findOne({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException(`Country code ${dto.code} already exists`);
    }

    const country = this.countryRepository.create({
      name: dto.name,
      code: dto.code,
      description: dto.description ?? null,
      createdBy: actor?.id,
      updatedBy: actor?.id,
    });
    const saved = await this.countryRepository.save(country);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  async update(id: string, dto: UpdateCountryDto, actor?: AuthUser) {
    const country = await this.requireCountry(id);
    if (dto.name !== undefined) {
      country.name = dto.name;
    }
    if (dto.description !== undefined) {
      country.description = dto.description;
    }
    country.updatedBy = actor?.id;
    const saved = await this.countryRepository.save(country);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  async setActive(id: string, dto: SetCountryActiveDto, actor?: AuthUser) {
    const country = await this.requireCountry(id);
    country.active = dto.active;
    country.updatedBy = actor?.id;
    const saved = await this.countryRepository.save(country);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  private async requireCountry(id: string) {
    const country = await this.countryRepository.findOne({ where: { id } });
    if (!country) {
      throw new NotFoundException('Country not found');
    }
    return country;
  }

  private async resolveActors(
    countries: readonly CountryMaster[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        countries
          .flatMap((country) => [country.createdBy, country.updatedBy])
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
    country: CountryMaster,
    actors: Map<string, PublicActor>,
  ) {
    return {
      id: country.id,
      name: country.name,
      code: country.code,
      description: country.description ?? null,
      active: country.active,
      createdDate: country.createdDate,
      updatedDate: country.updatedDate,
      createdBy: country.createdBy
        ? (actors.get(country.createdBy) ?? {
            id: country.createdBy,
            name: country.createdBy,
          })
        : null,
      updatedBy: country.updatedBy
        ? (actors.get(country.updatedBy) ?? {
            id: country.updatedBy,
            name: country.updatedBy,
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
