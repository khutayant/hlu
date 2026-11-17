import {
  EmployeeMaster,
  type FileInfo,
  type GenderEnum,
  UserMaster,
} from '../../../../libs/entity/src/index.js';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { AuthUser } from '../../../interfaces/auth-user.interface.js';
import { CODE_STRUCTURE } from '../../../resources/data/code-structure/code-structure.data.js';
import { GenCodeService } from '../../../services/global/gen-code/gen-code.service.js';
import { FILE_CATEGORY } from '../file/data/file-category.data.js';
import { FileService } from '../file/file.service.js';
import type { CreateEmployeeDto } from './dto/create-employee.dto.js';
import type { SetEmployeeActiveDto } from './dto/set-employee-active.dto.js';
import type { UpdateEmployeeDto } from './dto/update-employee.dto.js';

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
      qb.andWhere('employee.townshipName = :townshipName', { townshipName });
    }
    if (position) {
      qb.andWhere('employee.position = :position', { position });
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
      this.employeeRepository
        .createQueryBuilder('employee')
        .select('DISTINCT employee.townshipName', 'value')
        .where("TRIM(employee.townshipName) <> ''")
        .orderBy('employee.townshipName', 'ASC')
        .getRawMany<{ value: string }>(),
      this.employeeRepository
        .createQueryBuilder('employee')
        .select('DISTINCT employee.position', 'value')
        .where("TRIM(employee.position) <> ''")
        .orderBy('employee.position', 'ASC')
        .getRawMany<{ value: string }>(),
    ]);

    return {
      townships: townshipRows.map((row) => row.value).filter(Boolean),
      positions: positionRows.map((row) => row.value).filter(Boolean),
    };
  }

  async getById(id: string) {
    const employee = await this.findEmployeeOrFail(id);
    const actors = await this.resolveActors([employee]);
    return this.toPublicEmployee(employee, actors);
  }

  async create(dto: CreateEmployeeDto, actor?: AuthUser) {
    const employeeNo = await this.resolveEmployeeNo(dto.employeeNo);
    await this.assertEmployeeNoAvailable(employeeNo);
    await this.assertFocalNoAvailable(dto.focalNo);

    const employee = this.employeeRepository.create({
      employeeNo,
      displayName: dto.displayName,
      focalNo: dto.focalNo,
      gender: dto.gender,
      townshipName: dto.townshipName,
      position: dto.position,
      experience: dto.experience,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      hireDate: dto.hireDate ?? null,
      endDate: dto.endDate ?? null,
      remark: dto.remark ?? null,
      createdBy: actor?.id ?? null,
      updatedBy: actor?.id ?? null,
    });

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
    if (dto.townshipName !== undefined) {
      employee.townshipName = dto.townshipName;
    }
    if (dto.position !== undefined) {
      employee.position = dto.position;
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
        profileImage: true,
        user: { profileImage: true },
      },
    });
    if (!employee) {
      throw new NotFoundException('Employee not found');
    }
    return employee;
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
      displayName: employee.displayName,
      focalNo: employee.focalNo,
      gender: employee.gender,
      townshipName: employee.townshipName,
      position: employee.position,
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
