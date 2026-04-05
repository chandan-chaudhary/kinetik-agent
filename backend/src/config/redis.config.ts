import { registerAs } from '@nestjs/config';

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export interface RedisConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
  db: number;
  keyPrefix: string;
  ttl: number;
  bullPrefix: string;
  tls?: Record<string, never>;
}

export default registerAs('redis', () => {
  const tlsEnabled = process.env.REDIS_TLS === 'true';

  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseNumber(process.env.REDIS_PORT, 6379),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseNumber(process.env.REDIS_DB, 0),
    keyPrefix: process.env.REDIS_PREFIX || 'kinetik:',
    ttl: parseNumber(process.env.REDIS_CACHE_TTL_SECONDS, 60),
    bullPrefix: process.env.REDIS_BULL_PREFIX || 'bull',
    ...(tlsEnabled ? { tls: {} } : {}),
  } satisfies RedisConfig;
});
