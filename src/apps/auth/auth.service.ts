import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomBytes } from 'crypto';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Repository } from 'typeorm';
import {
  UserMaster,
  UserRoleEnum,
} from '../../../libs/entity/src/index.js';
import { AppEnv } from '../../resources/env/app.env.js';
import type { AuthUser } from '../../interfaces/auth-user.interface.js';
import type {
  KeycloakJwtPayload,
  KeycloakTokenResponse,
} from '../../interfaces/keycloak-token.interface.js';

type PendingLogin = {
  codeVerifier: string;
  redirectUri: string;
  returnTo: string;
  expiresAt: number;
};

const PENDING_TTL_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;
  private readonly issuer: string;
  private readonly authorizeUrl: string;
  private readonly tokenUrl: string;
  private readonly logoutUrl: string;
  private readonly pendingLogins = new Map<string, PendingLogin>();

  constructor(
    @InjectRepository(UserMaster)
    private readonly userRepository: Repository<UserMaster>,
  ) {
    const base = `${AppEnv.KEYCLOAK_URL}/realms/${AppEnv.KEYCLOAK_REALM}`;
    this.issuer = base;
    this.authorizeUrl = `${base}/protocol/openid-connect/auth`;
    this.tokenUrl = `${base}/protocol/openid-connect/token`;
    this.logoutUrl = `${base}/protocol/openid-connect/logout`;
    this.jwks = createRemoteJWKSet(
      new URL(`${base}/protocol/openid-connect/certs`),
    );
  }

  /** Start Authorization Code + PKCE login; client redirects the browser to authorizeUrl. */
  startLogin(redirectUri: string, returnTo = '/') {
    const normalizedRedirect = this.assertAllowedRedirectUri(redirectUri);
    const state = randomBytes(24).toString('base64url');
    const codeVerifier = randomBytes(32).toString('base64url');
    const codeChallenge = createHash('sha256')
      .update(codeVerifier)
      .digest('base64url');

    this.purgeExpiredPending();
    this.pendingLogins.set(state, {
      codeVerifier,
      redirectUri: normalizedRedirect,
      returnTo: this.sanitizeReturnTo(returnTo),
      expiresAt: Date.now() + PENDING_TTL_MS,
    });

    const params = new URLSearchParams({
      client_id: AppEnv.KEYCLOAK_CLIENT_ID,
      redirect_uri: normalizedRedirect,
      response_type: 'code',
      scope: 'openid profile email',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    });

    return {
      authorizeUrl: `${this.authorizeUrl}?${params.toString()}`,
      state,
    };
  }

  /** Exchange Keycloak authorization code for tokens and sync the local user. */
  async completeLogin(code: string, state: string) {
    this.purgeExpiredPending();
    const pending = this.pendingLogins.get(state);
    if (!pending) {
      throw new UnauthorizedException('Invalid or expired login state');
    }
    this.pendingLogins.delete(state);

    const tokens = await this.requestToken({
      grant_type: 'authorization_code',
      code,
      redirect_uri: pending.redirectUri,
      code_verifier: pending.codeVerifier,
    });

    const payload = await this.verifyAccessToken(tokens.access_token);
    const user = await this.upsertUserFromToken(payload);

    return {
      ...this.toAuthResponse(tokens, user),
      returnTo: pending.returnTo,
    };
  }

  async refresh(refreshToken: string) {
    const tokens = await this.requestToken({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    });

    const payload = await this.verifyAccessToken(tokens.access_token);
    const user = await this.upsertUserFromToken(payload);

    return this.toAuthResponse(tokens, user);
  }

  async logout(refreshToken?: string) {
    if (!refreshToken) {
      return { success: true };
    }

    const body = new URLSearchParams({
      client_id: AppEnv.KEYCLOAK_CLIENT_ID,
      client_secret: AppEnv.KEYCLOAK_CLIENT_SECRET,
      refresh_token: refreshToken,
    });

    const response = await fetch(this.logoutUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok && response.status !== 204) {
      const text = await response.text();
      this.logger.warn(`Keycloak logout failed: ${response.status} ${text}`);
    }

    return { success: true };
  }

  async me(authUser: AuthUser) {
    const user = await this.userRepository.findOne({
      where: { id: authUser.id, active: true },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.toPublicUser(user);
  }

  async resolveAuthUser(accessToken: string): Promise<AuthUser> {
    const payload = await this.verifyAccessToken(accessToken);
    const user = await this.upsertUserFromToken(payload);
    return {
      id: user.id,
      keycloakId: user.keycloakId,
      username: user.username,
      email: user.email,
      role: user.role,
    };
  }

  private assertAllowedRedirectUri(redirectUri: string) {
    if (typeof redirectUri !== 'string' || !redirectUri.trim()) {
      throw new BadRequestException('redirectUri is required');
    }

    const trimmed = redirectUri.trim();
    if (!AppEnv.KEYCLOAK_REDIRECT_URIS.includes(trimmed)) {
      throw new BadRequestException('redirectUri is not allowed');
    }

    return trimmed;
  }

  private sanitizeReturnTo(returnTo: string) {
    if (typeof returnTo !== 'string' || !returnTo.startsWith('/')) {
      return '/';
    }
    if (returnTo.startsWith('//')) {
      return '/';
    }
    return returnTo;
  }

  private purgeExpiredPending() {
    const now = Date.now();
    for (const [key, value] of this.pendingLogins) {
      if (value.expiresAt <= now) {
        this.pendingLogins.delete(key);
      }
    }
  }

  private async verifyAccessToken(
    accessToken: string,
  ): Promise<KeycloakJwtPayload> {
    try {
      // Keycloak access tokens typically use aud=account; validate issuer + signature only.
      const { payload } = await jwtVerify(accessToken, this.jwks, {
        issuer: this.issuer,
      });

      const claims = payload as KeycloakJwtPayload;
      if (claims.azp && claims.azp !== AppEnv.KEYCLOAK_CLIENT_ID) {
        throw new UnauthorizedException('Token client mismatch');
      }

      return claims;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.debug(
        `Access token verification failed: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private async upsertUserFromToken(
    payload: KeycloakJwtPayload,
  ): Promise<UserMaster> {
    if (!payload.sub) {
      throw new UnauthorizedException('Token missing subject');
    }

    const username =
      payload.preferred_username?.trim() ||
      payload.email?.trim() ||
      payload.sub;

    let user = await this.userRepository.findOne({
      where: { keycloakId: payload.sub },
    });

    if (!user) {
      user = this.userRepository.create({
        keycloakId: payload.sub,
        username,
        email: payload.email ?? null,
        emailVerified: payload.email_verified ?? false,
        firstName: payload.given_name ?? null,
        lastName: payload.family_name ?? null,
        role: this.resolveRole(payload),
        lastLoginAt: new Date(),
        active: true,
      });
    } else {
      user.username = username;
      user.email = payload.email ?? user.email;
      user.emailVerified = payload.email_verified ?? user.emailVerified;
      user.firstName = payload.given_name ?? user.firstName;
      user.lastName = payload.family_name ?? user.lastName;
      user.role = this.resolveRole(payload, user.role);
      user.lastLoginAt = new Date();
      user.active = true;
    }

    return this.userRepository.save(user);
  }

  private resolveRole(
    payload: KeycloakJwtPayload,
    fallback: UserRoleEnum = UserRoleEnum.STAFF,
  ): UserRoleEnum {
    const roles = [
      ...(payload.realm_access?.roles ?? []),
      ...(payload.resource_access?.[AppEnv.KEYCLOAK_CLIENT_ID]?.roles ?? []),
    ].map((role) => role.toUpperCase());

    if (roles.includes('ADMIN') || roles.includes('REALM-ADMIN')) {
      return UserRoleEnum.ADMIN;
    }
    if (roles.includes('VIEWER')) {
      return UserRoleEnum.VIEWER;
    }
    if (roles.includes('STAFF')) {
      return UserRoleEnum.STAFF;
    }

    return fallback;
  }

  private async requestToken(
    fields: Record<string, string>,
  ): Promise<KeycloakTokenResponse> {
    const body = new URLSearchParams({
      client_id: AppEnv.KEYCLOAK_CLIENT_ID,
      client_secret: AppEnv.KEYCLOAK_CLIENT_SECRET,
      ...fields,
    });

    const response = await fetch(this.tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = (await response.json()) as KeycloakTokenResponse & {
      error?: string;
      error_description?: string;
    };

    if (!response.ok || !data.access_token) {
      throw new UnauthorizedException(
        data.error_description || data.error || 'Authentication failed',
      );
    }

    return data;
  }

  private toAuthResponse(tokens: KeycloakTokenResponse, user: UserMaster) {
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresIn: tokens.expires_in,
      refreshExpiresIn: tokens.refresh_expires_in,
      tokenType: tokens.token_type,
      user: this.toPublicUser(user),
    };
  }

  private toPublicUser(user: UserMaster) {
    return {
      id: user.id,
      keycloakId: user.keycloakId,
      username: user.username,
      email: user.email,
      emailVerified: user.emailVerified,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
