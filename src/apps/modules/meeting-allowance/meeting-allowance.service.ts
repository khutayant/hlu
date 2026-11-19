import { MeetingAllowanceMaster } from '@app/entity/entities/master/meeting-allowance-master.entity';
import { MeetingMaster } from '@app/entity/entities/master/meeting-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import type { CreateMeetingAllowanceDto } from './dto/create-meeting-allowance.dto';
import type { SetMeetingAllowanceActiveDto } from './dto/set-meeting-allowance-active.dto';
import type { UpdateMeetingAllowanceDto } from './dto/update-meeting-allowance.dto';

type PublicActor = {
  id: string;
  name: string;
};

@Injectable()
export class MeetingAllowanceService {
  constructor(
    @InjectRepository(MeetingAllowanceMaster)
    private readonly allowanceRepository: Repository<MeetingAllowanceMaster>,
    @InjectRepository(MeetingMaster)
    private readonly meetingRepository: Repository<MeetingMaster>,
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

    const qb = this.allowanceRepository
      .createQueryBuilder('allowance')
      .leftJoinAndSelect('allowance.meeting', 'meeting')
      .where('meeting.id = :meetingId', { meetingId: options.meetingId })
      .andWhere('allowance.active = :active', { active })
      .orderBy('allowance.sequenceNo', 'ASC')
      .addOrderBy('allowance.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (q) {
      qb.andWhere(
        `(allowance.name ILIKE :search ESCAPE '\\'
          OR COALESCE(allowance.unitPriceLabel, '') ILIKE :search ESCAPE '\\'
          OR COALESCE(allowance.quantityLabel, '') ILIKE :search ESCAPE '\\'
          OR COALESCE(allowance.totalAmountLabel, '') ILIKE :search ESCAPE '\\')`,
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

  async create(dto: CreateMeetingAllowanceDto, actor?: AuthUser) {
    const meeting = await this.requireMeeting(dto.meetingId);
    const unitPrice = dto.unitPrice ?? '0';
    const quantity = dto.quantity ?? '0';
    const sequenceNo =
      dto.sequenceNo ?? (await this.nextSequenceNo(meeting.id));
    const allowance = this.allowanceRepository.create({
      meeting,
      name: dto.name,
      sequenceNo,
      unitPriceLabel: dto.unitPriceLabel ?? null,
      unitPrice,
      quantityLabel: dto.quantityLabel ?? null,
      quantity,
      totalAmountLabel: dto.totalAmountLabel ?? null,
      totalAmount: this.multiplyNumeric(unitPrice, quantity),
      showTotalOnly: dto.showTotalOnly ?? false,
      excludeHeadOffice: dto.excludeHeadOffice ?? false,
      createdBy: actor?.id,
      updatedBy: actor?.id,
    });
    const saved = await this.allowanceRepository.save(allowance);
    const full = await this.requireAllowance(saved.id);
    const actors = await this.resolveActors([full]);
    return this.toPublic(full, actors);
  }

  async update(
    id: string,
    dto: UpdateMeetingAllowanceDto,
    actor?: AuthUser,
  ) {
    const allowance = await this.requireAllowance(id);
    if (dto.name !== undefined) {
      allowance.name = dto.name;
    }
    if (dto.sequenceNo !== undefined) {
      allowance.sequenceNo = dto.sequenceNo;
    }
    if (dto.unitPriceLabel !== undefined) {
      allowance.unitPriceLabel = dto.unitPriceLabel;
    }
    if (dto.unitPrice !== undefined) {
      allowance.unitPrice = dto.unitPrice;
    }
    if (dto.quantityLabel !== undefined) {
      allowance.quantityLabel = dto.quantityLabel;
    }
    if (dto.quantity !== undefined) {
      allowance.quantity = dto.quantity;
    }
    if (dto.totalAmountLabel !== undefined) {
      allowance.totalAmountLabel = dto.totalAmountLabel;
    }
    if (dto.showTotalOnly !== undefined) {
      allowance.showTotalOnly = dto.showTotalOnly;
    }
    if (dto.excludeHeadOffice !== undefined) {
      allowance.excludeHeadOffice = dto.excludeHeadOffice;
    }
    // Always recompute total from unit price × quantity on save.
    allowance.totalAmount = this.multiplyNumeric(
      allowance.unitPrice,
      allowance.quantity,
    );
    allowance.updatedBy = actor?.id;
    const saved = await this.allowanceRepository.save(allowance);
    const full = await this.requireAllowance(saved.id);
    const actors = await this.resolveActors([full]);
    return this.toPublic(full, actors);
  }

  async setActive(
    id: string,
    dto: SetMeetingAllowanceActiveDto,
    actor?: AuthUser,
  ) {
    const allowance = await this.requireAllowance(id);
    allowance.active = dto.active;
    allowance.updatedBy = actor?.id;
    const saved = await this.allowanceRepository.save(allowance);
    const full = await this.requireAllowance(saved.id);
    const actors = await this.resolveActors([full]);
    return this.toPublic(full, actors);
  }

  private async nextSequenceNo(meetingId: string): Promise<number> {
    const raw = await this.allowanceRepository
      .createQueryBuilder('allowance')
      .select('MAX(allowance.sequenceNo)', 'max')
      .where('allowance.meetingId = :meetingId', { meetingId })
      .getRawOne<{ max: string | number | null }>();
    const max = Number(raw?.max ?? 0);
    return Number.isFinite(max) ? max + 1 : 1;
  }

  private async requireMeeting(id: string) {
    const meeting = await this.meetingRepository.findOne({ where: { id } });
    if (!meeting) {
      throw new NotFoundException('Meeting not found');
    }
    return meeting;
  }

  private async requireAllowance(id: string) {
    const allowance = await this.allowanceRepository.findOne({
      where: { id },
      relations: { meeting: true },
    });
    if (!allowance) {
      throw new NotFoundException('Meeting allowance not found');
    }
    return allowance;
  }

  private async resolveActors(
    rows: readonly MeetingAllowanceMaster[],
  ): Promise<Map<string, PublicActor>> {
    const ids = [
      ...new Set(
        rows
          .flatMap((row) => [row.createdBy, row.updatedBy])
          .filter((id): id is string => Boolean(id)),
      ),
    ];
    const map = new Map<string, PublicActor>();
    if (ids.length === 0) {
      return map;
    }
    const users = await this.userRepository.find({ where: { id: In(ids) } });
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
    allowance: MeetingAllowanceMaster,
    actors: Map<string, PublicActor>,
  ) {
    return {
      id: allowance.id,
      meetingId: allowance.meeting.id,
      name: allowance.name,
      sequenceNo: allowance.sequenceNo,
      unitPriceLabel: allowance.unitPriceLabel ?? null,
      unitPrice: allowance.unitPrice,
      quantityLabel: allowance.quantityLabel ?? null,
      quantity: allowance.quantity,
      totalAmountLabel: allowance.totalAmountLabel ?? null,
      totalAmount: allowance.totalAmount,
      showTotalOnly: allowance.showTotalOnly,
      excludeHeadOffice: allowance.excludeHeadOffice,
      active: allowance.active,
      createdDate: allowance.createdDate,
      updatedDate: allowance.updatedDate,
      createdBy: allowance.createdBy
        ? (actors.get(allowance.createdBy) ?? {
            id: allowance.createdBy,
            name: allowance.createdBy,
          })
        : null,
      updatedBy: allowance.updatedBy
        ? (actors.get(allowance.updatedBy) ?? {
            id: allowance.updatedBy,
            name: allowance.updatedBy,
          })
        : null,
    };
  }

  private multiplyNumeric(unitPrice: string, quantity: string): string {
    const price = Number(unitPrice);
    const qty = Number(quantity);
    if (!Number.isFinite(price) || !Number.isFinite(qty)) {
      return '0.00';
    }
    return (Math.round(price * qty * 100) / 100).toFixed(2);
  }

  private toIlikeContainsPattern(raw: string): string {
    const escaped = raw
      .replaceAll('\\', '\\\\')
      .replaceAll('%', '\\%')
      .replaceAll('_', '\\_');
    return `%${escaped}%`;
  }
}
