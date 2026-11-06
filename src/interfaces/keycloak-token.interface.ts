export type KeycloakTokenResponse = {
  access_token: string;
  expires_in: number;
  refresh_expires_in: number;
  refresh_token: string;
  token_type: string;
  id_token?: string;
  scope?: string;
  session_state?: string;
};

export type KeycloakJwtPayload = {
  sub: string;
  preferred_username?: string;
  email?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  name?: string;
  realm_access?: {
    roles?: string[];
  };
  resource_access?: Record<string, { roles?: string[] }>;
  exp?: number;
  iat?: number;
  iss?: string;
  azp?: string;
};
