import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import type { RedisConfig } from '@/config/redis.config';
import {
  REDIS_COMMAND,
  REDIS_PUBLISHER,
  REDIS_SUBSCRIBER,
} from '@/redis/redis.constants';

type RedisConnectionConfig =
  | { url: string; options: RedisOptions }
  | { options: RedisOptions };

const buildRedisConnection = (
  configService: ConfigService,
): RedisConnectionConfig => {
  const redis = configService.getOrThrow<RedisConfig>('redis');
  const baseOptions: RedisOptions = {
    db: redis.db,
    keyPrefix: redis.keyPrefix,
    enableReadyCheck: true,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => Math.min(times * 100, 2000),
    ...(redis.tls ? { tls: redis.tls } : {}),
  };

  const shouldUseUrl = process.env.NODE_ENV === 'production' && !!redis.url;
  console.log(shouldUseUrl, redis.url);

  if (shouldUseUrl && redis.url) {
    return {
      url: redis.url,
      options: {
        ...baseOptions,
        username: redis.username,
        password: redis.password,
      },
    };
  }

  return {
    options: {
      host: redis.host,
      port: redis.port,
      username: redis.username,
      password: redis.password,
      ...baseOptions,
    },
  };
};

const createRedisClient = (
  connection: RedisConnectionConfig,
  name: string,
): Redis => {
  const client =
    'url' in connection
      ? new Redis(connection.url, connection.options)
      : new Redis(connection.options);

  client.on('connect', () => {
    console.log(`[Redis:${name}] status: ${client.status}`);
  });

  client.on('error', (error) => {
    console.error(`[Redis:${name}] connection error:`, error.message);
  });

  return client;
};

export const redisProviders: Provider[] = [
  {
    provide: REDIS_COMMAND,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      createRedisClient(buildRedisConnection(configService), 'command'),
  },
  {
    provide: REDIS_PUBLISHER,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      createRedisClient(buildRedisConnection(configService), 'publisher'),
  },
  {
    provide: REDIS_SUBSCRIBER,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      createRedisClient(buildRedisConnection(configService), 'subscriber'),
  },
];
