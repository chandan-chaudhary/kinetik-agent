import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  nodeEnv: string;
}

export default registerAs('auth', () => ({
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '36000s',
  nodeEnv: process.env.NODE_ENV || 'development',
}));
