import { ImmunizationSessionMaster } from '@app/entity/entities/master/immunization-session-master.entity';
import { ProjectMaster } from '@app/entity/entities/master/project-master.entity';
import { TownshipMaster } from '@app/entity/entities/master/township-master.entity';
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
import { CODE_STRUCTURE } from '../../../resources/data/code-structure/code-structure.data';
import { GenCodeService } from '../../../services/global/gen-code/gen-code.service';
import type { CreateImmunizationSessionDto } from './dto/create-immunization-session.dto';
import type { SetImmunizationSessionActiveDto } from './dto/set-immunization-session-active.dto';
import type { UpdateImmunizationSessionDto } from './dto/update-immunization-session.dto';

type PublicActor = {
  id: string;
  name: string;
};

@Injectable()
export class ImmunizationSessionService {
  constructor(
    @InjectRepository(ImmunizationSessionMaster)
    private readonly sessionRepository: Repository<ImmunizationSessionMaster>,
    @InjectRepository(ProjectMaster)
    private readonly projectRepository: Repository<ProjectMaster>,
    @InjectRepository(TownshipMaster)
    private readonly townshipRepository: Repository<TownshipMaster>,
    @InjectRepository(UserMaster)
    private readonly userRepository: Repository<UserMaster>,
    private readonly genCodeService: GenCodeService,
  ) {}

  async list(options?: {
    page?: number;
    limit?: number;
    q?: string;
    active?: boolean;
    projectId?: string;
    townshipId?: string;
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();
    const active = options?.active ?? true;
    const projectId = options?.projectId?.trim();
    const townshipId = options?.townshipId?.trim();

    const qb = this.sessionRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.project', 'project')
      .leftJoinAndSelect('session.township', 'township')
      .where('session.active = :active', { active })
      .orderBy('session.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (projectId) {
      qb.andWhere('project.id = :projectId', { projectId });
    }

    if (townshipId) {
      qb.andWhere('township.id = :townshipId', { townshipId });
    }

    if (q) {
      qb.andWhere(
        `(session.name ILIKE :search ESCAPE '\\'
          OR session.sessionNo ILIKE :search ESCAPE '\\'
          OR COALESCE(session.description, '') ILIKE :search ESCAPE '\\'
          OR project.name ILIKE :search ESCAPE '\\'
          OR project.projectNo ILIKE :search ESCAPE '\\'
          OR township.name ILIKE :search ESCAPE '\\'
          OR township.code ILIKE :search ESCAPE '\\')`,
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
    const session = await this.requireSession(id);
    const actors = await this.resolveActors([session]);
    return this.toPublic(session, actors);
  }

  async create(dto: CreateImmunizationSessionDto, actor?: AuthUser) {
    const project = await this.requireProject(dto.projectId);
    const township = await this.requireTownship(dto.townshipId);
    const focalPrefix = township.focalPrefix.trim().toUpperCase();
    if (!/^[A-Z0-9]{1,5}$/.test(focalPrefix)) {
      throw new BadRequestException(
        'Township focal prefix must be 1–5 characters (A–Z, 0–9)',
      );
    }
    const sessionNo = await this.genCodeService.getInfoCode({
      structure: CODE_STRUCTURE.sessionNo,
      prefix: focalPrefix,
    });
    await this.assertSessionNoAvailable(sessionNo);
    await this.assertNameAvailable(dto.projectId, dto.townshipId, dto.name);

    const session = this.sessionRepository.create({
      name: dto.name,
      sessionNo,
      project,
      township,
      description: dto.description ?? null,
      createdBy: actor?.id,
      updatedBy: actor?.id,
    });
    const saved = await this.sessionRepository.save(session);
    return this.getById(saved.id);
  }

  async update(
    id: string,
    dto: UpdateImmunizationSessionDto,
    actor?: AuthUser,
  ) {
    const session = await this.requireSession(id);
    const nextProjectId = dto.projectId ?? session.project.id;
    const nextTownshipId = dto.townshipId ?? session.township.id;
    const nextName = dto.name ?? session.name;

    if (dto.projectId) {
      session.project = await this.requireProject(dto.projectId);
    }
    if (dto.townshipId) {
      session.township = await this.requireTownship(dto.townshipId);
    }
    if (dto.name !== undefined) {
      session.name = dto.name;
    }
    if (dto.description !== undefined) {
      session.description = dto.description;
    }

    if (
      dto.name !== undefined ||
      dto.projectId !== undefined ||
      dto.townshipId !== undefined
    ) {
      await this.assertNameAvailable(
        nextProjectId,
        nextTownshipId,
        nextName,
        session.id,
      );
    }

    session.updatedBy = actor?.id;
    await this.sessionRepository.save(session);
    return this.getById(session.id);
  }

  async setActive(
    id: string,
    dto: SetImmunizationSessionActiveDto,
    actor?: AuthUser,
  ) {
    const session = await this.requireSession(id);
    session.active = dto.active;
    session.updatedBy = actor?.id;
    await this.sessionRepository.save(session);
    return this.getById(session.id);
  }

  private async requireProject(id: string) {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project || !project.active) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private async requireTownship(id: string) {
    const township = await this.townshipRepository.findOne({ where: { id } });
    if (!township || !township.active) {
      throw new NotFoundException('Township not found');
    }
    return township;
  }

  private async requireSession(id: string) {
    const session = await this.sessionRepository.findOne({
      where: { id },
      relations: { project: true, township: true },
    });
    if (!session) {
      throw new NotFoundException('Immunization session not found');
    }
    return session;
  }

  private async assertSessionNoAvailable(sessionNo: string) {
    const existing = await this.sessionRepository.findOne({
      where: { sessionNo },
    });
    if (existing) {
      throw new ConflictException(
        `Immunization session number already exists: ${sessionNo}`,
      );
    }
  }

  private async assertNameAvailable(
    projectId: string,
    townshipId: string,
    name: string,
    excludeId?: string,
  ) {
    const existing = await this.sessionRepository.findOne({
      where: {
        project: { id: projectId },
        township: { id: townshipId },
        name,
      },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Immunization session name already exists in this project and township: ${name}`,
      );
    }
  }

  private async resolveActors(
    sessions: readonly ImmunizationSessionMaster[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        sessions
          .flatMap((session) => [session.createdBy, session.updatedBy])
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
    session: ImmunizationSessionMaster,
    actors: Map<string, PublicActor>,
  ) {
    return {
      id: session.id,
      name: session.name,
      sessionNo: session.sessionNo,
      description: session.description ?? null,
      projectId: session.project.id,
      project: session.project
        ? {
            id: session.project.id,
            name: session.project.name,
            projectNo: session.project.projectNo,
          }
        : null,
      townshipId: session.township.id,
      township: session.township
        ? {
            id: session.township.id,
            name: session.township.name,
            code: session.township.code,
          }
        : null,
      active: session.active,
      createdDate: session.createdDate,
      updatedDate: session.updatedDate,
      createdBy: session.createdBy
        ? (actors.get(session.createdBy) ?? {
            id: session.createdBy,
            name: session.createdBy,
          })
        : null,
      updatedBy: session.updatedBy
        ? (actors.get(session.updatedBy) ?? {
            id: session.updatedBy,
            name: session.updatedBy,
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
