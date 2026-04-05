import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import {
  REDIS_COMMAND,
  REDIS_PUBLISHER,
  REDIS_SUBSCRIBER,
} from '@/redis/redis.constants';

@Injectable()
export class RedisHealthService {
  constructor(
    @Inject(REDIS_COMMAND) private readonly commandClient: Redis,
    @Inject(REDIS_PUBLISHER) private readonly publisherClient: Redis,
    @Inject(REDIS_SUBSCRIBER) private readonly subscriberClient: Redis,
  ) {}

  async check(): Promise<Record<string, string>> {
    const [command, publisher, subscriber] = await Promise.all([
      this.commandClient.ping(),
      this.publisherClient.ping(),
      this.subscriberClient.ping(),
    ]);

    return {
      command,
      publisher,
      subscriber,
    };
  }
}
