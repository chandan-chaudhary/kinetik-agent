import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import type { RedisConfig } from '@/config/redis.config';
import {
  REDIS_COMMAND,
  REDIS_PUBLISHER,
  REDIS_SUBSCRIBER,
} from '@/redis/redis.constants';

const buildRedisOptions = (configService: ConfigService): RedisOptions => {
  const redis = configService.getOrThrow<RedisConfig>('redis');

  return {
    host: redis.host,
    port: redis.port,
    username: redis.username,
    password: redis.password,
    db: redis.db,
    keyPrefix: redis.keyPrefix,
    enableReadyCheck: true,
    maxRetriesPerRequest: null,
    retryStrategy: (times: number) => Math.min(times * 100, 2000),
    ...(redis.tls ? { tls: redis.tls } : {}),
  };
};

const createRedisClient = (options: RedisOptions): Redis => new Redis(options);

export const redisProviders: Provider[] = [
  {
    provide: REDIS_COMMAND,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      createRedisClient(buildRedisOptions(configService)),
  },
  {
    provide: REDIS_PUBLISHER,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      createRedisClient(buildRedisOptions(configService)),
  },
  {
    provide: REDIS_SUBSCRIBER,
    inject: [ConfigService],
    useFactory: (configService: ConfigService) =>
      createRedisClient(buildRedisOptions(configService)),
  },
];
