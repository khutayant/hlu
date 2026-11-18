import { UserRolePermissionMapping } from '@app/entity/entities/mapping/user-role-permission-mapping.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RbacPermissionResolveService } from './rbac-permission-resolve.service';

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
