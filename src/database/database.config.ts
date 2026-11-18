import { CodeGenInfo } from '@app/entity/entities/info/code-gen-info.entity';
import { FileInfo } from '@app/entity/entities/info/file-info.entity';
import { MeetingAttendanceInfo } from '@app/entity/entities/info/meeting-attendance-info.entity';
import { UserRoleModuleMapping } from '@app/entity/entities/mapping/user-role-module-mapping.entity';
import { UserRolePermissionMapping } from '@app/entity/entities/mapping/user-role-permission-mapping.entity';
import { UserUserRoleMapping } from '@app/entity/entities/mapping/user-user-role-mapping.entity';
import { CategoryMaster } from '@app/entity/entities/master/category-master.entity';
import { CountryMaster } from '@app/entity/entities/master/country-master.entity';
import { EmployeeMaster } from '@app/entity/entities/master/employee-master.entity';
import { LocationMaster } from '@app/entity/entities/master/location-master.entity';
import { ModuleMaster } from '@app/entity/entities/master/module-master.entity';
import { PermissionMaster } from '@app/entity/entities/master/permission-master.entity';
import { ImmunizationSessionMaster } from '@app/entity/entities/master/immunization-session-master.entity';
import { MeetingMaster } from '@app/entity/entities/master/meeting-master.entity';
import { ProjectMaster } from '@app/entity/entities/master/project-master.entity';
import { SessionMaster } from '@app/entity/entities/master/session-master.entity';
import { PositionMaster } from '@app/entity/entities/master/position-master.entity';
import { TitleMaster } from '@app/entity/entities/master/title-master.entity';
import { TownshipMaster } from '@app/entity/entities/master/township-master.entity';
import { UserMaster } from '@app/entity/entities/master/user-master.entity';
import { UserRoleMaster } from '@app/entity/entities/master/user-role-master.entity';
import { DataSource, type DataSourceOptions } from 'typeorm';
import { AppEnv } from '../resources/env/app.env';

export const DATABASE_CONNECTION = 'default';
export const DATABASE_MIGRATION_TABLE_NAME = 'database_migration';

const migrations = ['dist/migrations/**/*.js'];

export const DatabaseConfig: DataSourceOptions = {
  type: 'postgres',
  url: AppEnv.DATABASE_URL,
  entities: [
    UserMaster,
    EmployeeMaster,
    UserRoleMaster,
    UserUserRoleMapping,
    PermissionMaster,
    UserRolePermissionMapping,
    UserRoleModuleMapping,
    CategoryMaster,
    ModuleMaster,
    CountryMaster,
    TownshipMaster,
    TitleMaster,
    PositionMaster,
    LocationMaster,
    ProjectMaster,
    ImmunizationSessionMaster,
    MeetingMaster,
    MeetingAttendanceInfo,
    SessionMaster,
    CodeGenInfo,
    FileInfo,
  ],
  migrations,
  migrationsTableName: DATABASE_MIGRATION_TABLE_NAME,
  synchronize: false,
};

export default new DataSource(DatabaseConfig);
