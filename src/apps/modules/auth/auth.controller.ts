import {
  BadRequestException,
  Body,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiController,
  ApiGet,
  ApiPost,
} from '../../../decorators/api.decorator.js';
import { PERMISSION_ACTION } from '../../../resources/data/permissions/actions/permission-action.data.js';
import { buildRoutePermission } from '../../../resources/data/permissions/permission-code.tool.js';
import { PERMISSION_SUBJECT } from '../../../resources/data/permissions/subjects/permission-subject.data.js';
import { CurrentUser } from '../../../decorators/current-user.decorator.js';
import { Public } from '../../../decorators/public.decorator.js';
import type { AuthUser } from '../../../interfaces/auth-user.interface.js';
import { AuthService } from './auth.service.js';
import { parseCallbackDto } from './dto/callback.dto.js';
import { parseRefreshDto } from './dto/refresh.dto.js';

@ApiController({ code: 'AUTH', args: 'auth' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Start Keycloak Authorization Code + PKCE login.
   * Query: redirectUri (required, must be allowlisted), returnTo (optional path).
   * Returns authorizeUrl for the client to redirect the browser.
   */
  @Public()
  @ApiGet({
    code: 'AUTH_LOGIN',
    name: 'Start login',
    args: 'login',
    permission: null,
  })
  startLogin(
    @Query('redirectUri') redirectUri?: string,
    @Query('returnTo') returnTo?: string,
    @Query('kcAction') kcAction?: string,
  ) {
    return this.authService.startLogin(
      redirectUri ?? '',
      returnTo ?? '/',
      kcAction,
    );
  }

  /**
   * Finish Keycloak login after redirect back to the SPA with ?code=&state=.
   */
  @Public()
  @ApiPost({
    code: 'AUTH_CALLBACK',
    name: 'Login callback',
    args: 'callback',
    permission: null,
  })
  @HttpCode(200)
  async callback(@Body() body: unknown) {
    try {
      const dto = parseCallbackDto(body);
      return await this.authService.completeLogin(dto.code, dto.state);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      if (error instanceof Error && error.message.includes('required')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Public()
  @ApiPost({
    code: 'AUTH_REFRESH',
    name: 'Refresh tokens',
    args: 'refresh',
    permission: null,
  })
  @HttpCode(200)
  async refresh(@Body() body: unknown) {
    try {
      const dto = parseRefreshDto(body);
      return await this.authService.refresh(dto.refreshToken);
    } catch (error) {
      if (error instanceof Error && error.message.includes('required')) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Public()
  @ApiPost({
    code: 'AUTH_LOGOUT',
    name: 'Logout',
    args: 'logout',
    permission: null,
  })
  @HttpCode(200)
  async logout(@Body() body: unknown) {
    const refreshToken =
      body &&
      typeof body === 'object' &&
      typeof (body as { refreshToken?: unknown }).refreshToken === 'string'
        ? (body as { refreshToken: string }).refreshToken
        : undefined;

    return this.authService.logout(refreshToken);
  }

  @ApiGet({
    code: 'AUTH_ME',
    name: 'Current user',
    args: 'me',
    permission: buildRoutePermission({
      subject: PERMISSION_SUBJECT.AUTH,
      action: PERMISSION_ACTION.READ,
      description: 'Read the authenticated user profile',
    }),
  })
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user);
  }
}
