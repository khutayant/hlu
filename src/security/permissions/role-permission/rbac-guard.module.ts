import { UserRolePermissionMapping } from '@app/entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RbacPermissionResolveService } from './rbac-permission-resolve.service.js';

/**
 * Provides the permission lookup used by {@link RbacGuard}.
 * The guard itself is registered on `AppModule`.
 */
@Module({
  imports: [TypeOrmModule.forFeature([UserRolePermissionMapping])],
  providers: [RbacPermissionResolveService],
  exports: [RbacPermissionResolveService],
})
export class RbacGuardModule {}
