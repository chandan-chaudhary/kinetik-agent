export interface AuthenticatedUser {
  userId: string;
  email: string;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}
