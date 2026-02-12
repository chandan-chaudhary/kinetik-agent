import { Request } from 'express';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name?: string;
}

declare module 'express' {
  interface Request {
    user?: AuthenticatedUser;
  }
}
