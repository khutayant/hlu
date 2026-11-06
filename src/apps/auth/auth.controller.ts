import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Query,
} from '@nestjs/common';
import { CurrentUser } from '../../decorators/current-user.decorator.js';
import { Public } from '../../decorators/public.decorator.js';
import type { AuthUser } from '../../interfaces/auth-user.interface.js';
import { AuthService } from './auth.service.js';
import { parseCallbackDto } from './dto/callback.dto.js';
import { parseRefreshDto } from './dto/refresh.dto.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Start Keycloak Authorization Code + PKCE login.
   * Query: redirectUri (required, must be allowlisted), returnTo (optional path).
   * Returns authorizeUrl for the client to redirect the browser.
   */
  @Public()
  @Get('login')
  startLogin(
    @Query('redirectUri') redirectUri?: string,
    @Query('returnTo') returnTo?: string,
  ) {
    return this.authService.startLogin(redirectUri ?? '', returnTo ?? '/');
  }

  /**
   * Finish Keycloak login after redirect back to the SPA with ?code=&state=.
   */
  @Public()
  @Post('callback')
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
  @Post('refresh')
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
  @Post('logout')
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

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return this.authService.me(user);
  }
}
