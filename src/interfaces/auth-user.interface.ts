import type { UserRoleEnum } from '../../libs/entity/src/enums/user-role.enum';

export type AuthUser = {
  id: string;
  keycloakId: string;
  username: string;
  email?: string | null;
  role: UserRoleEnum;
};
