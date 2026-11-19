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
import { parseCreatePositionDto } from './dto/create-position.dto';
import { parseSetPositionActiveDto } from './dto/set-position-active.dto';
import { parseUpdatePositionDto } from './dto/update-position.dto';
import { PositionService } from './position.service';

@ApiController({ code: 'POSITION', args: 'position' })
export class PositionController {
  constructor(private readonly positionService: PositionService) {}

  @ApiGet({
    code: 'POSITION_LIST',
    name: 'List positions',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.POSITION,
      action: PERMISSION_ACTION.LIST,
      description: 'List positions',
    }),
  })
  list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
  ) {
    return this.positionService.list({
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
    });
  }

  @ApiGet({
    code: 'POSITION_GET',
    name: 'Get position',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.POSITION,
      action: PERMISSION_ACTION.READ,
      description: 'Read a position',
    }),
  })
  getById(@Param('id') id: string) {
    return this.positionService.getById(id);
  }

  @ApiPost({
    code: 'POSITION_CREATE',
    name: 'Create position',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.POSITION,
      action: PERMISSION_ACTION.CREATE,
      description: 'Create a position',
    }),
  })
  create(@Body() body: unknown, @CurrentUser() user: AuthUser) {
    const dto = this.parseOrBadRequest(() => parseCreatePositionDto(body));
    return this.positionService.create(dto, user);
  }

  @ApiPatch({
    code: 'POSITION_UPDATE',
    name: 'Update position',
    args: ':id',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.POSITION,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Update a position',
    }),
  })
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseUpdatePositionDto(body));
    return this.positionService.update(id, dto, user);
  }

  @ApiPatch({
    code: 'POSITION_SET_ACTIVE',
    name: 'Set position active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.POSITION,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Activate or deactivate a position',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseSetPositionActiveDto(body));
    return this.positionService.setActive(id, dto, user);
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
