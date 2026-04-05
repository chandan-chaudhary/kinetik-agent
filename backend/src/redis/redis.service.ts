import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_COMMAND } from '@/redis/redis.constants';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_COMMAND) private readonly commandClient: Redis) {}

  get client(): Redis {
    return this.commandClient;
  }

  buildKey(...parts: string[]): string {
    return ['app', ...parts].join(':');
  }
}
