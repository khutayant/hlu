import { EmployeeMaster } from '@app/entity/entities/master/employee-master.entity';
import type { FileInfo } from '@app/entity/entities/info/file-info.entity';
import type { GenderEnum } from '@app/entity/enums/gender.enum';
import { PositionMaster } from '@app/entity/entities/master/position-master.entity';
import { TitleMaster } from '@app/entity/entities/master/title-master.entity';
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
import { FILE_CATEGORY } from '../file/data/file-category.data';
import { FileService } from '../file/file.service';
import type { CreateEmployeeDto } from './dto/create-employee.dto';
import type { SetEmployeeActiveDto } from './dto/set-employee-active.dto';
import type { UpdateEmployeeDto } from './dto/update-employee.dto';

const ALLOWED_IMAGE_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
]);

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PublicActor = {
  id: string;
  name: string;
};

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(EmployeeMaster)
    private readonly employeeRepository: Repository<EmployeeMaster>,
    @InjectRepository(UserMaster)
    private readonly userRepository: Repository<UserMaster>,
    @InjectRepository(TitleMaster)
    private readonly titleRepository: Repository<TitleMaster>,
    @InjectRepository(PositionMaster)
    private readonly positionRepository: Repository<PositionMaster>,
    @InjectRepository(TownshipMaster)
    private readonly townshipRepository: Repository<TownshipMaster>,
    private readonly genCodeService: GenCodeService,
    private readonly fileService: FileService,
  ) {}

  async list(options?: {
    page?: number;
    limit?: number;
    q?: string;
    active?: boolean;
    gender?: GenderEnum;
    townshipName?: string;
    position?: string;
  }) {
    const page = Math.max(1, options?.page ?? 1);
    const limit = Math.min(100, Math.max(1, options?.limit ?? 20));
    const q = options?.q?.trim();
    const active = options?.active ?? true;
    const townshipName = options?.townshipName?.trim();
    const position = options?.position?.trim();

    const qb = this.employeeRepository
      .createQueryBuilder('employee')
      .leftJoinAndSelect('employee.title', 'title')
      .leftJoinAndSelect('employee.position', 'position')
      .leftJoinAndSelect('employee.township', 'township')
      .leftJoinAndSelect('employee.profileImage', 'employeeProfileImage')
      .leftJoinAndSelect('employee.user', 'user')
      .leftJoinAndSelect('user.profileImage', 'userProfileImage')
      .where('employee.active = :active', { active })
      .orderBy('employee.employeeNo', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    // Free-text search: name, H no (employeeNo), focal no only.
    if (q) {
      qb.andWhere(
        `(employee.employeeNo ILIKE :search ESCAPE '\\'
          OR employee.focalNo ILIKE :search ESCAPE '\\'
          OR employee.displayName ILIKE :search ESCAPE '\\')`,
        { search: this.toIlikeContainsPattern(q) },
      );
    }

    if (options?.gender) {
      qb.andWhere('employee.gender = :gender', { gender: options.gender });
    }
    if (townshipName) {
      qb.andWhere('township.name = :townshipName', { townshipName });
    }
    if (position) {
      qb.andWhere('position.name = :position', { position });
    }

    const [items, total] = await qb.getManyAndCount();
    const actors = await this.resolveActors(items);

    return {
      items: items.map((employee) => this.toPublicEmployee(employee, actors)),
      total,
      page,
      limit,
      active,
    };
  }

  /**
   * Which of the given focal numbers already exist (import duplicate check).
   * Lookup by `focalNo` only.
   */
  async findExistingFocalNos(focalNos: string[]): Promise<string[]> {
    const unique = [
      ...new Set(
        focalNos
          .map((value) => value.trim().toUpperCase())
          .filter(Boolean),
      ),
    ];
    if (unique.length === 0) {
      return [];
    }

    const rows = await this.employeeRepository.find({
      where: { focalNo: In(unique) },
    });

    return rows
      .map((row) => (row.focalNo ?? '').trim().toUpperCase())
      .filter(Boolean);
  }

  /** Distinct township / position values for list filter dropdowns. */
  async listFilterOptions() {
    const [townshipRows, positionRows] = await Promise.all([
      this.townshipRepository.find({
        where: { active: true },
        order: { name: 'ASC' },
      }),
      this.positionRepository.find({
        where: { active: true },
        order: { name: 'ASC' },
      }),
    ]);

    return {
      townships: townshipRows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
      })),
      positions: positionRows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
      })),
    };
  }

  /** Aggregates for the staff employee overview dashboard. */
  async overview(options?: { townshipId?: string; positionId?: string }) {
    const townshipId = options?.townshipId?.trim() || undefined;
    const positionId = options?.positionId?.trim() || undefined;

    if (townshipId && !UUID_RE.test(townshipId)) {
      throw new BadRequestException('Invalid township id');
    }
    if (positionId && !UUID_RE.test(positionId)) {
      throw new BadRequestException('Invalid position id');
    }

    const applyFilters = (
      qb: ReturnType<Repository<EmployeeMaster>['createQueryBuilder']>,
    ) => {
      if (townshipId) {
        qb.andWhere('employee.townshipId = :townshipId', { townshipId });
      }
      if (positionId) {
        qb.andWhere('employee.positionId = :positionId', { positionId });
      }
      return qb;
    };

    const townshipOrder = [
      'GANGAW_SOUTH',
      'GANGAW_NORTH',
      'SAW',
      'TILIN',
      'MYAING',
      'PAUK',
      'YESAGYO',
    ];

    const [
      statusRows,
      genderRows,
      townshipRows,
      positionRows,
      matrixTownships,
      matrixPositions,
      matrixCells,
    ] = await Promise.all([
      applyFilters(
        this.employeeRepository
          .createQueryBuilder('employee')
          .select('employee.active', 'active')
          .addSelect('COUNT(*)', 'count')
          .groupBy('employee.active'),
      ).getRawMany<{ active: boolean | string | number; count: string }>(),
      applyFilters(
        this.employeeRepository
          .createQueryBuilder('employee')
          .select('employee.gender', 'gender')
          .addSelect('COUNT(*)', 'count')
          .groupBy('employee.gender')
          .orderBy('COUNT(*)', 'DESC'),
      ).getRawMany<{ gender: string; count: string }>(),
      applyFilters(
        this.employeeRepository
          .createQueryBuilder('employee')
          .innerJoin('employee.township', 'township')
          .select('township.id', 'id')
          .addSelect('township.name', 'name')
          .addSelect('township.code', 'code')
          .addSelect('COUNT(*)', 'count')
          .addSelect(
            'SUM(CASE WHEN employee.active = true THEN 1 ELSE 0 END)',
            'activeCount',
          )
          .addSelect(
            'SUM(CASE WHEN employee.active = false THEN 1 ELSE 0 END)',
            'inactiveCount',
          )
          .groupBy('township.id')
          .addGroupBy('township.name')
          .addGroupBy('township.code')
          .orderBy('COUNT(*)', 'DESC')
          .addOrderBy('township.name', 'ASC'),
      ).getRawMany<{
        id: string;
        name: string;
        code: string;
        count: string;
        activeCount: string;
        inactiveCount: string;
      }>(),
      applyFilters(
        this.employeeRepository
          .createQueryBuilder('employee')
          .innerJoin('employee.position', 'position')
          .select('position.id', 'id')
          .addSelect('position.name', 'name')
          .addSelect('position.code', 'code')
          .addSelect('COUNT(*)', 'count')
          .addSelect(
            'SUM(CASE WHEN employee.active = true THEN 1 ELSE 0 END)',
            'activeCount',
          )
          .addSelect(
            'SUM(CASE WHEN employee.active = false THEN 1 ELSE 0 END)',
            'inactiveCount',
          )
          .groupBy('position.id')
          .addGroupBy('position.name')
          .addGroupBy('position.code')
          .orderBy('COUNT(*)', 'DESC')
          .addOrderBy('position.name', 'ASC'),
      ).getRawMany<{
        id: string;
        name: string;
        code: string;
        count: string;
        activeCount: string;
        inactiveCount: string;
      }>(),
      this.townshipRepository.find({
        where: {
          active: true,
          ...(townshipId ? { id: townshipId } : {}),
        },
        order: { name: 'ASC' },
      }),
      this.positionRepository.find({
        where: {
          active: true,
          ...(positionId ? { id: positionId } : {}),
        },
        order: { name: 'ASC' },
      }),
      applyFilters(
        this.employeeRepository
          .createQueryBuilder('employee')
          .select('employee.positionId', 'positionId')
          .addSelect('employee.townshipId', 'townshipId')
          .addSelect('COUNT(*)', 'count')
          .groupBy('employee.positionId')
          .addGroupBy('employee.townshipId'),
      ).getRawMany<{
        positionId: string;
        townshipId: string;
        count: string;
      }>(),
    ]);

    let active = 0;
    let inactive = 0;
    for (const row of statusRows) {
      const count = Number(row.count) || 0;
      if (row.active === true || row.active === 'true' || row.active === 1) {
        active = count;
      } else {
        inactive = count;
      }
    }

    const orderedTownships = [...matrixTownships].sort((a, b) => {
      const ai = townshipOrder.indexOf(a.code);
      const bi = townshipOrder.indexOf(b.code);
      if (ai === -1 && bi === -1) {
        return a.name.localeCompare(b.name);
      }
      if (ai === -1) {
        return 1;
      }
      if (bi === -1) {
        return -1;
      }
      return ai - bi;
    });

    const countMap = new Map<string, number>();
    for (const cell of matrixCells) {
      countMap.set(
        `${cell.positionId}:${cell.townshipId}`,
        Number(cell.count) || 0,
      );
    }

    const columnTotals: Record<string, number> = {};
    for (const township of orderedTownships) {
      columnTotals[township.id] = 0;
    }

    const matrixRows = matrixPositions.map((position) => {
      const counts: Record<string, number> = {};
      let rowTotal = 0;
      for (const township of orderedTownships) {
        const value =
          countMap.get(`${position.id}:${township.id}`) ?? 0;
        counts[township.id] = value;
        rowTotal += value;
        columnTotals[township.id] =
          (columnTotals[township.id] ?? 0) + value;
      }
      return {
        id: position.id,
        name: position.name,
        code: position.code,
        counts,
        total: rowTotal,
      };
    });

    const grandTotal = Object.values(columnTotals).reduce(
      (sum, value) => sum + value,
      0,
    );

    return {
      total: active + inactive,
      active,
      inactive,
      byGender: genderRows.map((row) => ({
        gender: row.gender,
        count: Number(row.count) || 0,
      })),
      byTownship: townshipRows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        count: Number(row.count) || 0,
        activeCount: Number(row.activeCount) || 0,
        inactiveCount: Number(row.inactiveCount) || 0,
      })),
      byPosition: positionRows.map((row) => ({
        id: row.id,
        name: row.name,
        code: row.code,
        count: Number(row.count) || 0,
        activeCount: Number(row.activeCount) || 0,
        inactiveCount: Number(row.inactiveCount) || 0,
      })),
      matrix: {
        columns: orderedTownships.map((township) => ({
          id: township.id,
          name: township.name,
          code: township.code,
        })),
        rows: matrixRows,
        columnTotals,
        grandTotal,
      },
    };
  }

  async getById(id: string) {
    const employee = await this.findEmployeeOrFail(id);
    const actors = await this.resolveActors([employee]);
    return this.toPublicEmployee(employee, actors);
  }

  async create(dto: CreateEmployeeDto, actor?: AuthUser) {
    // TEMP (employee list reseed): upsert by focalNo. Revert to create-only later.
    const existingByFocal = await this.employeeRepository.findOne({
      where: { focalNo: dto.focalNo },
    });
    if (existingByFocal) {
      return this.update(
        existingByFocal.id,
        {
          titleId: dto.titleId !== undefined ? dto.titleId : undefined,
          displayName: dto.displayName,
          gender: dto.gender,
          townshipId: dto.townshipId !== undefined ? dto.townshipId : undefined,
          townshipName:
            dto.townshipName !== undefined ? dto.townshipName : undefined,
          positionId: dto.positionId !== undefined ? dto.positionId : undefined,
          positionName:
            dto.positionName !== undefined ? dto.positionName : undefined,
          experience: dto.experience,
          email: dto.email ?? null,
          phone: dto.phone ?? null,
          hireDate: dto.hireDate ?? null,
          endDate: dto.endDate ?? null,
          remark: dto.remark ?? null,
          userId: dto.userId !== undefined ? dto.userId : undefined,
          profileImageId:
            dto.profileImageId !== undefined ? dto.profileImageId : undefined,
        },
        actor,
      );
    }

    const employeeNo = await this.resolveEmployeeNo(dto.employeeNo);
    await this.assertEmployeeNoAvailable(employeeNo);
    await this.assertFocalNoAvailable(dto.focalNo);

    const township = await this.resolveTownship({
      townshipId: dto.townshipId,
      townshipName: dto.townshipName,
    });
    const position = await this.resolvePosition({
      positionId: dto.positionId,
      positionName: dto.positionName,
    });

    const employee = this.employeeRepository.create({
      employeeNo,
      displayName: dto.displayName,
      focalNo: dto.focalNo,
      gender: dto.gender,
      township,
      position,
      experience: dto.experience,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      hireDate: dto.hireDate ?? null,
      endDate: dto.endDate ?? null,
      remark: dto.remark ?? null,
      createdBy: actor?.id ?? null,
      updatedBy: actor?.id ?? null,
    });

    if (dto.titleId) {
      employee.title = await this.resolveTitle(dto.titleId);
    }
    if (dto.userId) {
      employee.user = await this.resolveLinkableUser(dto.userId);
    }
    if (dto.profileImageId) {
      employee.profileImage = await this.resolveProfileImage(
        dto.profileImageId,
      );
    }

    const saved = await this.employeeRepository.save(employee);
    return this.getById(saved.id);
  }

  async update(id: string, dto: UpdateEmployeeDto, actor?: AuthUser) {
    const employee = await this.findEmployeeOrFail(id);

    if (dto.titleId !== undefined) {
      if (dto.titleId === null) {
        employee.title = null;
      } else {
        employee.title = await this.resolveTitle(dto.titleId);
      }
    }
    if (dto.displayName !== undefined) {
      employee.displayName = dto.displayName;
    }
    if (dto.focalNo !== undefined && dto.focalNo !== employee.focalNo) {
      await this.assertFocalNoAvailable(dto.focalNo, id);
      employee.focalNo = dto.focalNo;
    }
    if (dto.gender !== undefined) {
      employee.gender = dto.gender;
    }
    if (dto.townshipId !== undefined || dto.townshipName !== undefined) {
      employee.township = await this.resolveTownship({
        townshipId: dto.townshipId,
        townshipName: dto.townshipName,
      });
    }
    if (dto.positionId !== undefined || dto.positionName !== undefined) {
      employee.position = await this.resolvePosition({
        positionId: dto.positionId,
        positionName: dto.positionName,
      });
    }
    if (dto.experience !== undefined) {
      employee.experience = dto.experience;
    }
    if (dto.email !== undefined) {
      employee.email = dto.email;
    }
    if (dto.phone !== undefined) {
      employee.phone = dto.phone;
    }
    if (dto.hireDate !== undefined) {
      employee.hireDate = dto.hireDate;
    }
    if (dto.endDate !== undefined) {
      employee.endDate = dto.endDate;
    }
    if (dto.remark !== undefined) {
      employee.remark = dto.remark;
    }
    if (dto.userId !== undefined) {
      if (dto.userId === null) {
        employee.user = null;
      } else {
        employee.user = await this.resolveLinkableUser(dto.userId, id);
      }
    }
    if (dto.profileImageId !== undefined) {
      if (dto.profileImageId === null) {
        employee.profileImage = null;
      } else {
        employee.profileImage = await this.resolveProfileImage(
          dto.profileImageId,
        );
      }
    }

    employee.updatedBy = actor?.id ?? employee.updatedBy ?? null;
    await this.employeeRepository.save(employee);
    return this.getById(id);
  }

  async setActive(id: string, dto: SetEmployeeActiveDto, actor?: AuthUser) {
    const employee = await this.findEmployeeOrFail(id);
    employee.active = dto.active;
    employee.updatedBy = actor?.id ?? employee.updatedBy ?? null;
    await this.employeeRepository.save(employee);
    return this.getById(id);
  }

  private async findEmployeeOrFail(id: string) {
    if (!UUID_RE.test(id)) {
      throw new BadRequestException('Invalid employee id');
    }
    const employee = await this.employeeRepository.findOne({
      where: { id },
      relations: {
        title: true,
        position: true,
        township: true,
        profileImage: true,
        user: { profileImage: true },
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
  }

  private async resolveTownship(options: {
    townshipId?: string | null;
    townshipName?: string | null;
  }): Promise<TownshipMaster> {
    const townshipId = options.townshipId?.trim() || null;
    const townshipName = options.townshipName?.trim() || null;

    if (townshipId) {
      if (!UUID_RE.test(townshipId)) {
        throw new BadRequestException('Invalid township id');
      }
      const byId = await this.townshipRepository.findOne({
        where: { id: townshipId, active: true },
      });
      if (!byId) {
        throw new NotFoundException('Township not found');
      }
      return byId;
    }

    if (townshipName) {
      const byName = await this.townshipRepository.findOne({
        where: { name: townshipName, active: true },
      });
      if (!byName) {
        throw new NotFoundException(`Township not found: ${townshipName}`);
      }
      return byName;
    }

    throw new BadRequestException('townshipId or townshipName is required');
  }

  private async resolvePosition(options: {
    positionId?: string | null;
    positionName?: string | null;
  }): Promise<PositionMaster> {
    const positionId = options.positionId?.trim() || null;
    const positionName = options.positionName?.trim() || null;

    if (positionId) {
      if (!UUID_RE.test(positionId)) {
        throw new BadRequestException('Invalid position id');
      }
      const byId = await this.positionRepository.findOne({
        where: { id: positionId, active: true },
      });
      if (!byId) {
        throw new NotFoundException('Position not found');
      }
      return byId;
    }

    if (positionName) {
      const byName = await this.positionRepository.findOne({
        where: { name: positionName, active: true },
      });
      if (!byName) {
        throw new NotFoundException(`Position not found: ${positionName}`);
      }
      return byName;
    }

    throw new BadRequestException('positionId or positionName is required');
  }

  private async resolveTitle(titleId: string): Promise<TitleMaster> {
    if (!UUID_RE.test(titleId)) {
      throw new BadRequestException('Invalid title id');
    }
    const title = await this.titleRepository.findOne({
      where: { id: titleId, active: true },
    });
    if (!title) {
      throw new NotFoundException('Title not found');
    }
    return title;
  }

  private async resolveProfileImage(fileId: string): Promise<FileInfo> {
    const file = await this.fileService.requireActiveFileById(fileId);
    const mime = (file.mimeType || '').toLowerCase();
    if (!ALLOWED_IMAGE_MIME.has(mime)) {
      throw new BadRequestException(
        'Only PNG, JPEG, WebP, AVIF, or GIF images are allowed',
      );
    }
    if (
      file.category?.code &&
      file.category.code !== FILE_CATEGORY.PROFILE_IMAGE.code
    ) {
      throw new BadRequestException('File category must be PROFILE_IMAGE');
    }
    return file;
  }

  private async resolveEmployeeNo(value?: string | null) {
    const trimmed = value?.trim();
    if (trimmed) {
      return trimmed;
    }
    return this.genCodeService.getInfoCode({
      structure: CODE_STRUCTURE.employeeNo,
    });
  }

  private async assertEmployeeNoAvailable(
    employeeNo: string,
    excludeId?: string,
  ) {
    const existing = await this.employeeRepository.findOne({
      where: { employeeNo },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(
        `Employee number already exists: ${employeeNo}`,
      );
    }
  }

  private async assertFocalNoAvailable(focalNo: string, excludeId?: string) {
    const existing = await this.employeeRepository.findOne({
      where: { focalNo },
    });
    if (existing && existing.id !== excludeId) {
      throw new ConflictException(`Focal number already exists: ${focalNo}`);
    }
  }

  private async resolveLinkableUser(userId: string, excludeEmployeeId?: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const linked = await this.employeeRepository.findOne({
      where: { user: { id: userId } },
    });
    if (linked && linked.id !== excludeEmployeeId) {
      throw new ConflictException('User is already linked to an employee');
    }

    return user;
  }

  private async resolveActors(
    employees: readonly EmployeeMaster[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        employees
          .flatMap((employee) => [employee.createdBy, employee.updatedBy])
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

  private toPublicEmployee(
    employee: EmployeeMaster,
    actors: Map<string, PublicActor>,
  ) {
    const user = employee.user;

    return {
      id: employee.id,
      employeeNo: employee.employeeNo,
      title: employee.title
        ? {
            id: employee.title.id,
            name: employee.title.name,
          }
        : null,
      displayName: employee.displayName,
      focalNo: employee.focalNo,
      gender: employee.gender,
      township: employee.township
        ? {
            id: employee.township.id,
            name: employee.township.name,
            code: employee.township.code,
            focalPrefix: employee.township.focalPrefix,
          }
        : null,
      /** @deprecated Prefer `township.name` — kept for import/export compatibility. */
      townshipName: employee.township?.name ?? '',
      position: employee.position
        ? {
            id: employee.position.id,
            name: employee.position.name,
            code: employee.position.code,
          }
        : null,
      /** @deprecated Prefer `position.name` — kept for import/export compatibility. */
      positionName: employee.position?.name ?? '',
      experience: employee.experience,
      email: employee.email ?? null,
      phone: employee.phone ?? null,
      hireDate: employee.hireDate ?? null,
      endDate: employee.endDate ?? null,
      remark: employee.remark ?? null,
      active: employee.active,
      createdDate: employee.createdDate,
      updatedDate: employee.updatedDate,
      createdBy: employee.createdBy
        ? (actors.get(employee.createdBy) ?? {
            id: employee.createdBy,
            name: employee.createdBy,
          })
        : null,
      updatedBy: employee.updatedBy
        ? (actors.get(employee.updatedBy) ?? {
            id: employee.updatedBy,
            name: employee.updatedBy,
          })
        : null,
      profileImage: employee.profileImage
        ? {
            id: employee.profileImage.id,
            uuidName: employee.profileImage.uuidName,
            mimeType: employee.profileImage.mimeType,
          }
        : null,
      user: user
        ? {
            id: user.id,
            username: user.username,
            displayName:
              [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
              user.username,
            email: user.email ?? null,
            profileImage: user.profileImage
              ? {
                  id: user.profileImage.id,
                  uuidName: user.profileImage.uuidName,
                  mimeType: user.profileImage.mimeType,
                }
              : null,
          }
        : null,
    };
  }

  private toIlikeContainsPattern(value: string) {
    return `%${value.replace(/[\\%_]/g, '\\$&')}%`;
  }
}
