export { BaseEntityWithNoPrimary } from './bases/entity-no-primary.base.js';
export { BaseEntityWithUuid } from './bases/entity.base.js';
export { CodeGenInfo } from './entities/info/code-gen-info.entity.js';
export { FileInfo } from './entities/info/file-info.entity.js';
export { UserRoleModuleMapping } from './entities/mapping/user-role-module-mapping.entity.js';
export { UserRolePermissionMapping } from './entities/mapping/user-role-permission-mapping.entity.js';
export { UserUserRoleMapping } from './entities/mapping/user-user-role-mapping.entity.js';
export { CategoryMaster } from './entities/master/category-master.entity.js';
export { LocationMaster } from './entities/master/location-master.entity.js';
export { ModuleMaster } from './entities/master/module-master.entity.js';
export { PermissionMaster } from './entities/master/permission-master.entity.js';
export { ProjectMaster } from './entities/master/project-master.entity.js';
export { SessionMaster } from './entities/master/session-master.entity.js';
export { UserMaster } from './entities/master/user-master.entity.js';
export { UserRoleMaster } from './entities/master/user-role-master.entity.js';
export { UserRoleEnum } from './enums/user-role.enum.js';

import { CodeGenInfo } from './entities/info/code-gen-info.entity.js';
import { FileInfo } from './entities/info/file-info.entity.js';
import { UserRoleModuleMapping } from './entities/mapping/user-role-module-mapping.entity.js';
import { UserRolePermissionMapping } from './entities/mapping/user-role-permission-mapping.entity.js';
import { UserUserRoleMapping } from './entities/mapping/user-user-role-mapping.entity.js';
import { CategoryMaster } from './entities/master/category-master.entity.js';
import { LocationMaster } from './entities/master/location-master.entity.js';
import { ModuleMaster } from './entities/master/module-master.entity.js';
import { PermissionMaster } from './entities/master/permission-master.entity.js';
import { ProjectMaster } from './entities/master/project-master.entity.js';
import { SessionMaster } from './entities/master/session-master.entity.js';
import { UserMaster } from './entities/master/user-master.entity.js';
import { UserRoleMaster } from './entities/master/user-role-master.entity.js';

/** All TypeORM entities registered with the data source. */
export const entities = [
  UserMaster,
  UserRoleMaster,
  UserUserRoleMapping,
  PermissionMaster,
  UserRolePermissionMapping,
  UserRoleModuleMapping,
  CategoryMaster,
  ModuleMaster,
  LocationMaster,
  ProjectMaster,
  SessionMaster,
  CodeGenInfo,
  FileInfo,
];
