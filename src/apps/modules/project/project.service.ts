import { ProjectMaster } from '@app/entity/entities/master/project-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import { CODE_STRUCTURE } from '../../../resources/data/code-structure/code-structure.data';
import { GenCodeService } from '../../../services/global/gen-code/gen-code.service';
import type { CreateProjectDto } from './dto/create-project.dto';
import type { SetProjectActiveDto } from './dto/set-project-active.dto';
import type { UpdateProjectDto } from './dto/update-project.dto';

type PublicActor = {
  id: string;
  name: string;
};

@Injectable()
export class ProjectService {
  constructor(
    @InjectRepository(ProjectMaster)
    private readonly projectRepository: Repository<ProjectMaster>,
    @InjectRepository(UserMaster)
    private readonly userRepository: Repository<UserMaster>,
    private readonly genCodeService: GenCodeService,
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

    const qb = this.projectRepository
      .createQueryBuilder('project')
      .where('project.active = :active', { active })
      .orderBy('project.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.andWhere(
        `(project.name ILIKE :search ESCAPE '\\'
          OR project.projectNo ILIKE :search ESCAPE '\\'
          OR COALESCE(project.description, '') ILIKE :search ESCAPE '\\')`,
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
    const project = await this.requireProject(id);
    const actors = await this.resolveActors([project]);
    return this.toPublic(project, actors);
  }

  async create(dto: CreateProjectDto, actor?: AuthUser) {
    const projectNo = await this.genCodeService.getInfoCode({
      structure: CODE_STRUCTURE.projectNo,
    });
    await this.assertProjectNoAvailable(projectNo);

    const project = this.projectRepository.create({
      name: dto.name,
      projectNo,
      description: dto.description ?? null,
      createdBy: actor?.id,
      updatedBy: actor?.id,
    });
    const saved = await this.projectRepository.save(project);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  async update(id: string, dto: UpdateProjectDto, actor?: AuthUser) {
    const project = await this.requireProject(id);
    if (dto.name !== undefined) {
      project.name = dto.name;
    }
    if (dto.description !== undefined) {
      project.description = dto.description;
    }
    project.updatedBy = actor?.id;
    const saved = await this.projectRepository.save(project);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  async setActive(id: string, dto: SetProjectActiveDto, actor?: AuthUser) {
    const project = await this.requireProject(id);
    project.active = dto.active;
    project.updatedBy = actor?.id;
    const saved = await this.projectRepository.save(project);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  private async requireProject(id: string) {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  private async assertProjectNoAvailable(projectNo: string) {
    const existing = await this.projectRepository.findOne({
      where: { projectNo },
    });
    if (existing) {
      throw new ConflictException(
        `Project number already exists: ${projectNo}`,
      );
    }
  }

  private async resolveActors(
    projects: readonly ProjectMaster[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        projects
          .flatMap((project) => [project.createdBy, project.updatedBy])
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
    project: ProjectMaster,
    actors: Map<string, PublicActor>,
  ) {
    return {
      id: project.id,
      name: project.name,
      projectNo: project.projectNo,
      description: project.description ?? null,
      active: project.active,
      createdDate: project.createdDate,
      updatedDate: project.updatedDate,
      createdBy: project.createdBy
        ? (actors.get(project.createdBy) ?? {
            id: project.createdBy,
            name: project.createdBy,
          })
        : null,
      updatedBy: project.updatedBy
        ? (actors.get(project.updatedBy) ?? {
            id: project.updatedBy,
            name: project.updatedBy,
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
