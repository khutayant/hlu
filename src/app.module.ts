import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DataSeedingEngineModule } from './apps/engines/data-seeding-engine/data-seeding-engine.module.js';
import { AuthModule } from './apps/modules/auth/auth.module.js';
import { FileModule } from './apps/modules/file/file.module.js';
import { UserProfileModule } from './apps/modules/user-profile/user-profile.module.js';
import { UserRolePermissionModule } from './apps/modules/user-role-permission/user-role-permission.module.js';
import { DatabaseConfig } from './database/database.config.js';
import { AuthGuard } from './guards/auth.guard.js';
import { RbacGuard } from './guards/rbac-guard/rbac.guard.js';
import { RbacGuardModule } from './security/permissions/role-permission/rbac-guard.module.js';
import { ApiDecoratorCheckerModule } from './helpers/api-decorator-checker/api-decorator-checker.module.js';
import { GenCodeModule } from './services/global/gen-code/gen-code.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot(DatabaseConfig),
    DataSeedingEngineModule,
    ApiDecoratorCheckerModule,
    AuthModule,
    RbacGuardModule,
    GenCodeModule,
    FileModule,
    UserProfileModule,
    UserRolePermissionModule,
  ],
  controllers: [AppController],
  providers: [
    // Auth first so `request.user` exists. RBAC then skips `@Public()` routes.
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RbacGuard },
    AppService,
  ],
})
export class AppModule {}
