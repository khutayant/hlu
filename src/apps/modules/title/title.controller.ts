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
import { parseCreateTitleDto } from './dto/create-title.dto';
import { parseSetTitleActiveDto } from './dto/set-title-active.dto';
import { parseUpdateTitleDto } from './dto/update-title.dto';
import { TitleService } from './title.service';

@ApiController({ code: 'TITLE', args: 'title' })
export class TitleController {
  constructor(private readonly titleService: TitleService) {}

  @ApiGet({
    code: 'TITLE_LIST',
    name: 'List titles',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.TITLE,
      action: PERMISSION_ACTION.LIST,
      description: 'List titles',
    }),
  })
  list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
  ) {
    return this.titleService.list({
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
    });
  }

  @ApiGet({
    code: 'TITLE_GET',
    name: 'Get title',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.TITLE,
      action: PERMISSION_ACTION.READ,
      description: 'Read a title',
    }),
  })
  getById(@Param('id') id: string) {
    return this.titleService.getById(id);
  }

  @ApiPost({
    code: 'TITLE_CREATE',
    name: 'Create title',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.TITLE,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create a title',
    }),
  })
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() => parseCreateTitleDto(body));
    return this.titleService.create(dto, user);
  }

  @ApiPatch({
    code: 'TITLE_UPDATE',
    name: 'Update title',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.TITLE,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Update a title',
    }),
  })
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseUpdateTitleDto(body));
    return this.titleService.update(id, dto, user);
  }

  @ApiPatch({
    code: 'TITLE_SET_ACTIVE',
    name: 'Set title active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.TITLE,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Activate or deactivate a title',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseSetTitleActiveDto(body));
    return this.titleService.setActive(id, dto, user);
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
