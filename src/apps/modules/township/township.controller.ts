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
  ApiPut,
} from '../../../decorators/api.decorator';
import { CurrentUser } from '../../../decorators/current-user.decorator';
import type { AuthUser } from '../../../interfaces/auth-user.interface';
import { PERMISSION_ACTION } from '../../../resources/data/permissions/actions/permission-action.data';
import { buildRoutePermission } from '../../../resources/data/permissions/permission-code.tool';
import { PERMISSION_SUBJECT } from '../../../resources/data/permissions/subjects/permission-subject.data';
import { parseCreateTownshipDto } from './dto/create-township.dto';
import { parseSetTownshipActiveDto } from './dto/set-township-active.dto';
import { parseUpdateTownshipDto } from './dto/update-township.dto';
import { TownshipService } from './township.service';

@ApiController({ code: 'TOWNSHIP', args: 'township' })
export class TownshipController {
  constructor(private readonly townshipService: TownshipService) {}

  @ApiGet({
    code: 'TOWNSHIP_LIST',
    name: 'List townships',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.TOWNSHIP,
      action: PERMISSION_ACTION.LIST,
      description: 'List townships',
    }),
  })
  list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
    @Query('countryId') countryId?: string,
  ) {
    return this.townshipService.list({
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
      countryId: countryId?.trim() || undefined,
    });
  }

  @ApiGet({
    code: 'TOWNSHIP_GET',
    name: 'Get township',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.TOWNSHIP,
      action: PERMISSION_ACTION.READ,
      description: 'Read a township',
    }),
  })
  getById(@Param('id') id: string) {
    return this.townshipService.getById(id);
  }

  @ApiPost({
    code: 'TOWNSHIP_CREATE',
    name: 'Create township',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.TOWNSHIP,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create a township',
    }),
  })
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() => parseCreateTownshipDto(body));
    return this.townshipService.create(dto, user);
  }

  @ApiPut({
    code: 'TOWNSHIP_UPDATE',
    name: 'Update township',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.TOWNSHIP,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Update a township',
    }),
  })
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseUpdateTownshipDto(body));
    return this.townshipService.update(id, dto, user);
  }

  @ApiPatch({
    code: 'TOWNSHIP_SET_ACTIVE',
    name: 'Set township active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.TOWNSHIP,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Activate or deactivate a township',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseSetTownshipActiveDto(body));
    return this.townshipService.setActive(id, dto, user);
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
