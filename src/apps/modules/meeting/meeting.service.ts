import { MeetingMaster } from '@app/entity/entities/master/meeting-master.entity';
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
import type { CreateMeetingDto } from './dto/create-meeting.dto';
import type { SetMeetingActiveDto } from './dto/set-meeting-active.dto';
import type { UpdateMeetingDto } from './dto/update-meeting.dto';

type PublicActor = {
  id: string;
  name: string;
};

@Injectable()
export class MeetingService {
  constructor(
    @InjectRepository(MeetingMaster)
    private readonly meetingRepository: Repository<MeetingMaster>,
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

    const qb = this.meetingRepository
      .createQueryBuilder('meeting')
      .where('meeting.active = :active', { active })
      .orderBy('meeting.fromDate', 'DESC')
      .addOrderBy('meeting.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.andWhere(
        `(meeting.name ILIKE :search ESCAPE '\\'
          OR meeting.meetingNo ILIKE :search ESCAPE '\\'
          OR COALESCE(meeting.description, '') ILIKE :search ESCAPE '\\')`,
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
    const meeting = await this.requireMeeting(id);
    const actors = await this.resolveActors([meeting]);
    return this.toPublic(meeting, actors);
  }

  async create(dto: CreateMeetingDto, actor?: AuthUser) {
    const meetingNo = await this.genCodeService.getInfoCode({
      structure: CODE_STRUCTURE.meetingNo,
    });
    await this.assertMeetingNoAvailable(meetingNo);

    const fromDate = this.parseDateTime(dto.fromDate);
    const toDate = this.parseDateTime(dto.toDate);
    this.assertDateRange(fromDate, toDate);

    const meeting = this.meetingRepository.create({
      name: dto.name,
      meetingNo,
      fromDate,
      toDate,
      description: dto.description ?? null,
      createdBy: actor?.id,
      updatedBy: actor?.id,
    });
    const saved = await this.meetingRepository.save(meeting);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  async update(id: string, dto: UpdateMeetingDto, actor?: AuthUser) {
    const meeting = await this.requireMeeting(id);
    if (dto.name !== undefined) {
      meeting.name = dto.name;
    }
    if (dto.fromDate !== undefined) {
      meeting.fromDate = this.parseDateTime(dto.fromDate);
    }
    if (dto.toDate !== undefined) {
      meeting.toDate = this.parseDateTime(dto.toDate);
    }
    if (dto.description !== undefined) {
      meeting.description = dto.description;
    }

    this.assertDateRange(meeting.fromDate, meeting.toDate);
    meeting.updatedBy = actor?.id;
    const saved = await this.meetingRepository.save(meeting);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  async setActive(id: string, dto: SetMeetingActiveDto, actor?: AuthUser) {
    const meeting = await this.requireMeeting(id);
    meeting.active = dto.active;
    meeting.updatedBy = actor?.id;
    const saved = await this.meetingRepository.save(meeting);
    const actors = await this.resolveActors([saved]);
    return this.toPublic(saved, actors);
  }

  private async requireMeeting(id: string) {
    const meeting = await this.meetingRepository.findOne({ where: { id } });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    return meeting;
  }

  private async assertMeetingNoAvailable(meetingNo: string) {
    const existing = await this.meetingRepository.findOne({
      where: { meetingNo },
    });
    if (existing) {
      throw new ConflictException(
        `Meeting number already exists: ${meetingNo}`,
      );
    }
  }

  private parseDateTime(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Invalid datetime: ${value}`);
    }
    return date;
  }

  private assertDateRange(fromDate: Date, toDate: Date) {
    if (toDate.getTime() < fromDate.getTime()) {
      throw new BadRequestException('toDate must be on or after fromDate');
    }
  }

  private async resolveActors(
    meetings: readonly MeetingMaster[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        meetings
          .flatMap((meeting) => [meeting.createdBy, meeting.updatedBy])
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

  private toPublic(meeting: MeetingMaster, actors: Map<string, PublicActor>) {
    return {
      id: meeting.id,
      name: meeting.name,
      meetingNo: meeting.meetingNo,
      fromDate: meeting.fromDate.toISOString(),
      toDate: meeting.toDate.toISOString(),
      description: meeting.description ?? null,
      active: meeting.active,
      createdDate: meeting.createdDate,
      updatedDate: meeting.updatedDate,
      createdBy: meeting.createdBy
        ? (actors.get(meeting.createdBy) ?? {
            id: meeting.createdBy,
            name: meeting.createdBy,
          })
        : null,
      updatedBy: meeting.updatedBy
        ? (actors.get(meeting.updatedBy) ?? {
            id: meeting.updatedBy,
            name: meeting.updatedBy,
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
