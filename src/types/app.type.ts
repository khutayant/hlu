import type { AuthUser } from '../interfaces/auth-user.interface.js';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: AuthUser;
    }
  }
}

export {};
