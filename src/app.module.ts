import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DataSeedingEngineModule } from './apps/engines/data-seeding-engine/data-seeding-engine.module';
import { AuthModule } from './apps/modules/auth/auth.module';
import { CountryModule } from './apps/modules/country/country.module';
import { EmployeeModule } from './apps/modules/employee/employee.module';
import { FileModule } from './apps/modules/file/file.module';
import { ProjectModule } from './apps/modules/project/project.module';
import { PositionModule } from './apps/modules/position/position.module';
import { TitleModule } from './apps/modules/title/title.module';
import { TownshipModule } from './apps/modules/township/township.module';
import { UserModule } from './apps/modules/user/user.module';
import { UserProfileModule } from './apps/modules/user-profile/user-profile.module';
import { UserRolePermissionModule } from './apps/modules/user-role-permission/user-role-permission.module';
import { DatabaseConfig } from './database/database.config';
import { AuthGuard } from './guards/auth.guard';
import { RbacGuard } from './guards/rbac-guard/rbac.guard';
import { RbacGuardModule } from './security/permissions/role-permission/rbac-guard.module';
import { ApiDecoratorCheckerModule } from './helpers/api-decorator-checker/api-decorator-checker.module';
import { GenCodeModule } from './services/global/gen-code/gen-code.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(DatabaseConfig),
    DataSeedingEngineModule,
    ApiDecoratorCheckerModule,
    AuthModule,
    RbacGuardModule,
    GenCodeModule,
    FileModule,
    UserModule,
    EmployeeModule,
    CountryModule,
    TownshipModule,
    ProjectModule,
    TitleModule,
    PositionModule,
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
