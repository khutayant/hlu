import {
  BadRequestException,
  Body,
  HttpException,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiController,
  ApiGet,
  ApiPatch,
  ApiPost,
} from '../../../decorators/api.decorator';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import { PERMISSION_ACTION } from '../../../resources/data/permissions/actions/permission-action.data';
import { buildRoutePermission } from '../../../resources/data/permissions/permission-code.tool';
import { PERMISSION_SUBJECT } from '../../../resources/data/permissions/subjects/permission-subject.data';
import { parseCreateMeetingAttendanceDto } from './dto/create-meeting-attendance.dto';
import {
  parseImportMeetingAttendanceDto,
  parseResolveMeetingAttendanceImportDto,
} from './dto/import-meeting-attendance.dto';
import { MeetingAttendanceService } from './meeting-attendance.service';

@ApiController({ code: 'MEETING_ATTENDANCE', args: 'meeting-attendance' })
export class MeetingAttendanceController {
  constructor(
    private readonly meetingAttendanceService: MeetingAttendanceService,
  ) {}

  @ApiGet({
    code: 'MEETING_ATTENDANCE_LIST',
    name: 'List meeting attendance',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.LIST,
      description: 'List meeting attendance',
    }),
  })
  list(
    @Query('meetingId') meetingId?: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
  ) {
    if (!meetingId?.trim()) {
      throw new BadRequestException('meetingId is required');
    }
    return this.meetingAttendanceService.list({
      meetingId: meetingId.trim(),
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
    });
  }

  @ApiPost({
    code: 'MEETING_ATTENDANCE_CREATE',
    name: 'Create meeting attendance',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create a meeting attendance row',
    }),
  })
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() =>
      parseCreateMeetingAttendanceDto(body),
    );
    return this.meetingAttendanceService.create(dto, user);
  }

  @ApiPost({
    code: 'MEETING_ATTENDANCE_IMPORT',
    name: 'Import meeting attendance',
    args: 'import',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.CREATE,
      description: 'Import meeting attendance rows',
    }),
  })
  importRows(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() =>
      parseImportMeetingAttendanceDto(body),
    );
    return this.meetingAttendanceService.importRows(dto, user);
  }

  @ApiPost({
    code: 'MEETING_ATTENDANCE_RESOLVE_IMPORT',
    name: 'Resolve meeting attendance import focals',
    args: 'import/resolve',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.LIST,
      description: 'Resolve focal numbers for meeting attendance import',
    }),
  })
  resolveImport(@Body() body: unknown) {
    const dto = this.parseOrBadRequest(() =>
      parseResolveMeetingAttendanceImportDto(body),
    );
    return this.meetingAttendanceService.resolveImport(dto);
  }

  @ApiPatch({
    code: 'MEETING_ATTENDANCE_SET_ACTIVE',
    name: 'Set meeting attendance active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Activate or deactivate a meeting attendance row',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    if (!body || typeof body !== 'object') {
      throw new BadRequestException('Request body is required');
    }
    const record = body as Record<string, unknown>;
    if (typeof record.active !== 'boolean') {
      throw new BadRequestException('active must be a boolean');
    }
    return this.meetingAttendanceService.setActive(id, record.active, user);
  }

  private parseActiveQuery(active?: string): boolean | undefined {
    if (active === undefined || active === '') {
      return undefined;
    }
    if (active === 'true') {
      return true;
    }
    if (active === 'false') {
      return false;
    }
    throw new BadRequestException('active must be true or false');
  }

  private parseOrBadRequest<T>(parse: () => T): T {
    try {
      return parse();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Invalid request body',
      );
    }
  }
}
