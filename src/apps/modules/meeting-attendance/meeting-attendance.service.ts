import { MeetingAttendanceInfo } from '@app/entity/entities/info/meeting-attendance-info.entity';
import { EmployeeMaster } from '@app/entity/entities/master/employee-master.entity';
import { MeetingMaster } from '@app/entity/entities/master/meeting-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import type { CreateMeetingAttendanceDto } from './dto/create-meeting-attendance.dto';
import type {
  ImportMeetingAttendanceDto,
  ResolveMeetingAttendanceImportDto,
} from './dto/import-meeting-attendance.dto';

type PublicActor = {
  id: string;
  name: string;
};

@Injectable()
export class MeetingAttendanceService {
  constructor(
    @InjectRepository(MeetingAttendanceInfo)
    private readonly attendanceRepository: Repository<MeetingAttendanceInfo>,
    @InjectRepository(MeetingMaster)
    private readonly meetingRepository: Repository<MeetingMaster>,
    @InjectRepository(EmployeeMaster)
    private readonly employeeRepository: Repository<EmployeeMaster>,
    @InjectRepository(UserMaster)
    private readonly userRepository: Repository<UserMaster>,
  ) {}

  async list(options: {
    meetingId: string;
    page?: number;
    limit?: number;
    q?: string;
    active?: boolean;
  }) {
    await this.requireMeeting(options.meetingId);

    const page = Math.max(1, options.page ?? 1);
    const limit = Math.min(100, Math.max(1, options.limit ?? 20));
    const q = options.q?.trim();
    const active = options.active ?? true;

    const qb = this.attendanceRepository
      .createQueryBuilder('attendance')
      .innerJoinAndSelect('attendance.meeting', 'meeting')
      .innerJoinAndSelect('attendance.employee', 'employee')
      .leftJoinAndSelect('employee.title', 'title')
      .where('meeting.id = :meetingId', {
        meetingId: options.meetingId,
      })
      .andWhere('attendance.active = :active', { active })
      .orderBy('employee.displayName', 'ASC')
      .addOrderBy('employee.focalNo', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.andWhere(
        `(employee.displayName ILIKE :search ESCAPE '\\'
          OR employee.focalNo ILIKE :search ESCAPE '\\'
          OR employee.employeeNo ILIKE :search ESCAPE '\\'
          OR COALESCE(attendance.remark, '') ILIKE :search ESCAPE '\\')`,
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

  async create(dto: CreateMeetingAttendanceDto, actor?: AuthUser) {
    const meeting = await this.requireMeeting(dto.meetingId);
    const employee = await this.requireEmployeeByFocalNo(dto.focalNo);
    await this.assertNotAlreadyAttending(meeting.id, employee.id);

    const attendance = this.attendanceRepository.create({
      meeting,
      employee,
      remark: dto.remark ?? null,
      createdBy: actor?.id,
      updatedBy: actor?.id,
    });
    const saved = await this.attendanceRepository.save(attendance);
    const full = await this.requireAttendance(saved.id);
    const actors = await this.resolveActors([full]);
    return this.toPublic(full, actors);
  }

  async importRows(dto: ImportMeetingAttendanceDto, actor?: AuthUser) {
    const meeting = await this.requireMeeting(dto.meetingId);
    const results: Array<{
      focalNo: string;
      ok: boolean;
      error?: string;
      item?: ReturnType<MeetingAttendanceService['toPublic']>;
    }> = [];

    for (const row of dto.rows) {
      try {
        const employee = await this.requireEmployeeByFocalNo(row.focalNo);
        await this.assertNotAlreadyAttending(meeting.id, employee.id);

        const attendance = this.attendanceRepository.create({
          meeting,
          employee,
          remark: row.remark ?? null,
          createdBy: actor?.id,
          updatedBy: actor?.id,
        });
        const saved = await this.attendanceRepository.save(attendance);
        const full = await this.requireAttendance(saved.id);
        const actors = await this.resolveActors([full]);
        results.push({
          focalNo: row.focalNo,
          ok: true,
          item: this.toPublic(full, actors),
        });
      } catch (error) {
        results.push({
          focalNo: row.focalNo,
          ok: false,
          error:
            error instanceof Error ? error.message : 'Failed to import row',
        });
      }
    }

    const imported = results.filter((row) => row.ok).length;
    return {
      imported,
      failed: results.length - imported,
      results,
    };
  }

  /**
   * Resolve focal numbers for import validation:
   * - found employees
   * - missing focals
   * - already attending this meeting
   */
  async resolveImport(dto: ResolveMeetingAttendanceImportDto) {
    await this.requireMeeting(dto.meetingId);
    const unique = [...new Set(dto.focalNos.map((value) => value.trim().toUpperCase()).filter(Boolean))];
    if (unique.length === 0) {
      return { found: [], missing: [], alreadyAttending: [] };
    }

    const employees = await this.employeeRepository.find({
      where: { focalNo: In(unique), active: true },
      relations: { title: true },
    });
    const foundByFocal = new Map(
      employees.map((employee) => [
        (employee.focalNo ?? '').trim().toUpperCase(),
        employee,
      ]),
    );

    const found = unique
      .map((focalNo) => foundByFocal.get(focalNo))
      .filter((employee): employee is EmployeeMaster => Boolean(employee))
      .map((employee) => ({
        focalNo: employee.focalNo,
        employeeId: employee.id,
        displayName: employee.displayName,
        titleName: employee.title?.name ?? null,
        employeeNo: employee.employeeNo,
      }));

    const missing = unique.filter((focalNo) => !foundByFocal.has(focalNo));

    const employeeIds = found.map((item) => item.employeeId);
    let alreadyAttending: string[] = [];
    if (employeeIds.length > 0) {
      const existing = await this.attendanceRepository.find({
        where: {
          meeting: { id: dto.meetingId },
          employee: { id: In(employeeIds) },
          active: true,
        },
        relations: { employee: true },
      });
      alreadyAttending = existing
        .map((row) => (row.employee?.focalNo ?? '').trim().toUpperCase())
        .filter(Boolean);
    }

    return { found, missing, alreadyAttending };
  }

  async setActive(
    id: string,
    active: boolean,
    actor?: AuthUser,
  ) {
    const attendance = await this.requireAttendance(id);
    attendance.active = active;
    attendance.updatedBy = actor?.id;
    const saved = await this.attendanceRepository.save(attendance);
    const full = await this.requireAttendance(saved.id);
    const actors = await this.resolveActors([full]);
    return this.toPublic(full, actors);
  }

  private async requireMeeting(id: string) {
    const meeting = await this.meetingRepository.findOne({ where: { id } });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    return meeting;
  }

  private async requireEmployeeByFocalNo(focalNo: string) {
    const employee = await this.employeeRepository.findOne({
      where: { focalNo, active: true },
      relations: { title: true },
    });
    if (!employee) {
      throw new NotFoundException(`Employee not found for focal no: ${focalNo}`);
    }
    return employee;
  }

  private async requireAttendance(id: string) {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: { employee: { title: true }, meeting: true },
    });
    if (!attendance) {
      throw new NotFoundException('Attendance record not found');
    }
    return attendance;
  }

  private async assertNotAlreadyAttending(
    meetingId: string,
    employeeId: string,
  ) {
    const existing = await this.attendanceRepository.findOne({
      where: {
        meeting: { id: meetingId },
        employee: { id: employeeId },
        active: true,
      },
    });
    if (existing) {
      throw new ConflictException(
        'Employee is already on the attendance list for this meeting',
      );
    }
  }

  private async resolveActors(
    rows: readonly MeetingAttendanceInfo[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        rows
          .flatMap((row) => [row.createdBy, row.updatedBy])
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    if (ids.length === 0) {
      return new Map();
    }
    const users = await this.userRepository.find({
      where: { id: In(ids) },
    });
    const map = new Map<string, PublicActor>();
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
    attendance: MeetingAttendanceInfo,
    actors: Map<string, PublicActor>,
  ) {
    const employee = attendance.employee;
    return {
      id: attendance.id,
      meetingId: attendance.meeting?.id,
      remark: attendance.remark ?? null,
      active: attendance.active,
      createdDate: attendance.createdDate,
      updatedDate: attendance.updatedDate,
      createdBy: attendance.createdBy
        ? (actors.get(attendance.createdBy) ?? {
            id: attendance.createdBy,
            name: attendance.createdBy,
          })
        : null,
      updatedBy: attendance.updatedBy
        ? (actors.get(attendance.updatedBy) ?? {
            id: attendance.updatedBy,
            name: attendance.updatedBy,
          })
        : null,
      employee: employee
        ? {
            id: employee.id,
            employeeNo: employee.employeeNo,
            focalNo: employee.focalNo,
            displayName: employee.displayName,
            titleName: employee.title?.name ?? null,
          }
        : null,
    };
  }

  private toIlikeContainsPattern(raw: string) {
    return `%${raw.replace(/[\\%_]/g, '\\$&')}%`;
  }
}
