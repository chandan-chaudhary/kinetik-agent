import { registerAs } from '@nestjs/config';

const parseNumber = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export interface RedisConfig {
  url?: string;
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

interface ParsedRedisUrl {
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  db?: number;
  tls?: Record<string, never>;
}

const parseRedisUrl = (value: string | undefined): ParsedRedisUrl => {
  if (!value) return {};

  try {
    const parsed = new URL(value);
    const dbFromPath = parsed.pathname?.replace('/', '');
    const db = dbFromPath ? Number.parseInt(dbFromPath, 10) : undefined;

    return {
      host: parsed.hostname || undefined,
      port: parsed.port ? Number.parseInt(parsed.port, 10) : undefined,
      username: parsed.username
        ? decodeURIComponent(parsed.username)
        : undefined,
      password: parsed.password
        ? decodeURIComponent(parsed.password)
        : undefined,
      db: Number.isNaN(db) ? undefined : db,
      ...(parsed.protocol === 'rediss:' ? { tls: {} } : {}),
    };
  } catch {
    return {};
  }
};

export default registerAs('redis', () => {
  const redisUrl =
    process.env.REDIS_URL || 'redis://red-d7bssruuk2gs73930s50:6379';
  const parsedRedisUrl = parseRedisUrl(redisUrl);
  const tlsEnabled =
    process.env.REDIS_TLS === 'true' || Boolean(parsedRedisUrl.tls);

  return {
    url: redisUrl || undefined,
    host: process.env.REDIS_HOST || parsedRedisUrl.host || '127.0.0.1',
    port: parseNumber(process.env.REDIS_PORT, parsedRedisUrl.port ?? 6379),
    username:
      process.env.REDIS_USERNAME || parsedRedisUrl.username || undefined,
    password:
      process.env.REDIS_PASSWORD || parsedRedisUrl.password || undefined,
    db: parseNumber(process.env.REDIS_DB, parsedRedisUrl.db ?? 0),
    keyPrefix: process.env.REDIS_PREFIX || 'kinetik:',
    ttl: parseNumber(process.env.REDIS_CACHE_TTL_SECONDS, 60),
    bullPrefix: process.env.REDIS_BULL_PREFIX || 'bull',
    ...(tlsEnabled ? { tls: {} } : {}),
  } satisfies RedisConfig;
});
