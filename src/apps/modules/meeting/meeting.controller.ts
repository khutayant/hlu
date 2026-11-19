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
import { parseCreateMeetingDto } from './dto/create-meeting.dto';
import { parseSetMeetingActiveDto } from './dto/set-meeting-active.dto';
import { parseUpdateMeetingDto } from './dto/update-meeting.dto';
import { MeetingService } from './meeting.service';

@ApiController({ code: 'MEETING', args: 'meeting' })
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) {}

  @ApiGet({
    code: 'MEETING_LIST',
    name: 'List meetings',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.LIST,
      description: 'List meetings',
    }),
  })
  list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.meetingService.list({
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
      projectId: projectId?.trim() || undefined,
    });
  }

  @ApiGet({
    code: 'MEETING_GET',
    name: 'Get meeting',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.READ,
      description: 'Read a meeting',
    }),
  })
  getById(@Param('id') id: string) {
    return this.meetingService.getById(id);
  }

  @ApiPost({
    code: 'MEETING_CREATE',
    name: 'Create meeting',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create a meeting',
    }),
  })
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() => parseCreateMeetingDto(body));
    return this.meetingService.create(dto, user);
  }

  @ApiPatch({
    code: 'MEETING_UPDATE',
    name: 'Update meeting',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Update a meeting',
    }),
  })
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseUpdateMeetingDto(body));
    return this.meetingService.update(id, dto, user);
  }

  @ApiPatch({
    code: 'MEETING_SET_ACTIVE',
    name: 'Set meeting active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.MEETING,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Activate or deactivate a meeting',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseSetMeetingActiveDto(body));
    return this.meetingService.setActive(id, dto, user);
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
