import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import {
  APP_HTTP_ROUTE_KEY,
  type ApiHttpRouteMeta,
} from '../../decorators/api.decorator.js';
import { IS_PUBLIC_KEY } from '../../decorators/public.decorator.js';
import { formatPermissionRef } from '../../helpers/api-decorator-checker/tools/format-permission.tool.js';
import { forbiddenPermissionException } from './forbidden-permission.tool.js';
import { RbacPermissionResolveService } from '../../security/permissions/role-permission/rbac-permission-resolve.service.js';

/**
 * Global guard after {@link AuthGuard}.
 *
 * Enforces the `@Api*` `permission` on the route. Public routes and routes
 * with `permission: null` are skipped. Grants come from the signed-in user's
 * active user roles (`subject` `all` and action `manage` still satisfy).
 */
@Injectable()
export class RbacGuard implements CanActivate {
  private readonly logger = new Logger(RbacGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly permissionResolveService: RbacPermissionResolveService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const route = this.reflector.getAllAndOverride<ApiHttpRouteMeta | undefined>(
      APP_HTTP_ROUTE_KEY,
      [context.getHandler(), context.getClass()],
    );
    // `@Api*` `permission: null` is unbound and allowed. Auth still applies.
    if (!route || route.permission == null) {
      return true;
    }

    const required = route.permission;
    if (!required.subject || !required.action) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.user?.id;
    if (!userId) {
      this.logger.error('RBAC: no authenticated user on a protected route.');
      throw new UnauthorizedException('No logged in user.');
    }

    const grants = await this.permissionResolveService.resolveForUser(userId);
    const allowed = this.permissionResolveService.isGranted(grants, {
      subject: required.subject,
      action: required.action,
    });

    if (!allowed) {
      const ref = formatPermissionRef(required.subject, required.action);
      this.logger.error(
        `RBAC: [ReqID: ${request.id}] user ${userId} denied ${ref}`,
      );
      throw forbiddenPermissionException(
        request.id,
        required.subject,
        required.action,
      );
    }

    return true;
  }
}
