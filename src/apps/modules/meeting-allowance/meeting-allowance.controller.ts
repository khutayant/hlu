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
import { parseCreateMeetingAllowanceDto } from './dto/create-meeting-allowance.dto';
import { parseSetMeetingAllowanceActiveDto } from './dto/set-meeting-allowance-active.dto';
import { parseUpdateMeetingAllowanceDto } from './dto/update-meeting-allowance.dto';
import { MeetingAllowanceService } from './meeting-allowance.service';

@ApiController({ code: 'MEETING_ALLOWANCE', args: 'meeting-allowance' })
export class MeetingAllowanceController {
  constructor(
    private readonly meetingAllowanceService: MeetingAllowanceService,
  ) {}

  @ApiGet({
    code: 'MEETING_ALLOWANCE_LIST',
    name: 'List meeting allowances',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.LIST,
      description: 'List meeting allowances',
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
    return this.meetingAllowanceService.list({
      meetingId: meetingId.trim(),
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
    });
  }

  @ApiPost({
    code: 'MEETING_ALLOWANCE_CREATE',
    name: 'Create meeting allowance',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create a meeting allowance',
    }),
  })
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() =>
      parseCreateMeetingAllowanceDto(body),
    );
    return this.meetingAllowanceService.create(dto, user);
  }

  @ApiPatch({
    code: 'MEETING_ALLOWANCE_UPDATE',
    name: 'Update meeting allowance',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Update a meeting allowance',
    }),
  })
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() =>
      parseUpdateMeetingAllowanceDto(body),
    );
    return this.meetingAllowanceService.update(id, dto, user);
  }

  @ApiPatch({
    code: 'MEETING_ALLOWANCE_SET_ACTIVE',
    name: 'Set meeting allowance active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Activate or deactivate a meeting allowance',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() =>
      parseSetMeetingAllowanceActiveDto(body),
    );
    return this.meetingAllowanceService.setActive(id, dto, user);
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
