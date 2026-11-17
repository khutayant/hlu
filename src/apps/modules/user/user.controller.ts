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
} from '../../../decorators/api.decorator.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import type { AuthUser } from '../../../interfaces/auth-user.interface.js';
import { PERMISSION_ACTION } from '../../../resources/data/permissions/actions/permission-action.data.js';
import { buildRoutePermission } from '../../../resources/data/permissions/permission-code.tool.js';
import { PERMISSION_SUBJECT } from '../../../resources/data/permissions/subjects/permission-subject.data.js';
import { parseSetUserActiveDto } from './dto/set-user-active.dto.js';
import { UserService } from './user.service.js';

/**
 * User admin API under `/api/{base}/v1/user`.
 *
 * Account-owner profile routes stay on `/user/me` ({@link UserProfileController}).
 */
@ApiController({ code: 'USER', args: 'user' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * List users by active status.
   *
   * `GET /user?q=&page=&limit=&active=true|false`
   */
  @ApiGet({
    code: 'USER_LIST',
    name: 'List users',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER,
      action: PERMISSION_ACTION.LIST,
      description: 'List users',
    }),
  })
  list(
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('active') active?: string,
  ) {
    return this.userService.list({
      q: q?.trim() || undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      active: this.parseActiveQuery(active),
    });
  }

  /**
   * Set whether a user is active.
   *
   * `PATCH /user/:id/active`
   * Body: `{ active: boolean }`
   */
  @ApiPatch({
    code: 'USER_SET_ACTIVE',
    name: 'Set user active status',
    args: ':id/active',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.USER,
      action: PERMISSION_ACTION.UPDATE,
      description: 'Activate or deactivate a user',
    }),
  })
  setActive(
    @Param('id') id: string,
    @Body() body: unknown,
    @CurrentUser() user: AuthUser,
  ) {
    const dto = this.parseOrBadRequest(() => parseSetUserActiveDto(body));
    return this.userService.setActive(id, dto, user);
  }

  private parseActiveQuery(value?: string): boolean | undefined {
    if (value === undefined || value === '') {
      return undefined;
    }
    if (value === 'true' || value === '1') {
      return true;
    }
    if (value === 'false' || value === '0') {
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
