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
import { parseCreateImmunizationSessionDto } from './dto/create-immunization-session.dto';
import { parseSetImmunizationSessionActiveDto } from './dto/set-immunization-session-active.dto';
import { parseUpdateImmunizationSessionDto } from './dto/update-immunization-session.dto';
import { ImmunizationSessionService } from './immunization-session.service';

@ApiController({ code: 'IMMUNIZATION_SESSION', args: 'immunization-session' })
export class ImmunizationSessionController {
  constructor(
    private readonly immunizationSessionService: ImmunizationSessionService,
  ) {}

  @ApiGet({
    code: 'IMMUNIZATION_SESSION_LIST',
    name: 'List immunization sessions',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.PROJECT,
      action: PERMISSION_ACTION.LIST,
      description: 'List immunization sessions',
    }),
  })
  list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
    @Query('projectId') projectId?: string,
    @Query('townshipId') townshipId?: string,
  ) {
    return this.immunizationSessionService.list({
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
      projectId: projectId?.trim() || undefined,
      townshipId: townshipId?.trim() || undefined,
    });
  }

  @ApiGet({
    code: 'IMMUNIZATION_SESSION_GET',
    name: 'Get immunization session',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.PROJECT,
      action: PERMISSION_ACTION.READ,
      description: 'Read an immunization session',
    }),
  })
  getById(@Param('id') id: string) {
    return this.immunizationSessionService.getById(id);
  }

  @ApiPost({
    code: 'IMMUNIZATION_SESSION_CREATE',
    name: 'Create immunization session',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.PROJECT,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create an immunization session',
    }),
  })
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() =>
      parseCreateImmunizationSessionDto(body),
    );
    return this.immunizationSessionService.create(dto, user);
  }

  @ApiPatch({
    code: 'IMMUNIZATION_SESSION_UPDATE',
    name: 'Update immunization session',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.PROJECT,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Update an immunization session',
    }),
  })
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() =>
      parseUpdateImmunizationSessionDto(body),
    );
    return this.immunizationSessionService.update(id, dto, user);
  }

  @ApiPatch({
    code: 'IMMUNIZATION_SESSION_SET_ACTIVE',
    name: 'Set immunization session active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.PROJECT,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Activate or deactivate an immunization session',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() =>
      parseSetImmunizationSessionActiveDto(body),
    );
    return this.immunizationSessionService.setActive(id, dto, user);
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
