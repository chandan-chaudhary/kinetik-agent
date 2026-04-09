// import { CacheModule } from '@nestjs/cache-manager';
import {
  Global,
  Inject,
  Logger,
  Module,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Redis from 'ioredis';
import {
  REDIS_COMMAND,
  REDIS_PUBLISHER,
  REDIS_SUBSCRIBER,
} from '@/redis/redis.constants';
import { redisProviders } from '@/redis/redis.providers';
import { RedisService } from '@/redis/redis.service';
import { RedisHealthService } from '@/redis/redis-health.service';
import { PubSubService } from '@/redis/pubsub.service';
import { CacheHelperService } from '@/redis/cache-helper.service';

@Global()
@Module({
  imports: [
    ConfigModule,
    // CacheModule.registerAsync({
    //   imports: [ConfigModule],
    //   inject: [ConfigService],
    //   useFactory: async (configService: ConfigService) => {
    //     const redis = configService.getOrThrow<RedisConfig>('redis');

    //     const store = await redisStore({
    //       // socket:{

    //       // }

    //       host: redis.host,
    //       port: redis.port,
    //       username: redis.username,
    //       password: redis.password,
    //       db: redis.db,
    //       keyPrefix: redis.keyPrefix,
    //       ttl: redis.ttl,
    //       ...(redis.tls ? { tls: redis.tls } : {}),
    //     });

    //     return {
    //       stores: [store],
    //     };
    //   },
    //   isGlobal: true,
    // }),
  ],
  providers: [
    ...redisProviders,
    RedisService,
    RedisHealthService,
    PubSubService,
    CacheHelperService,
  ],
  exports: [
    REDIS_COMMAND,
    REDIS_PUBLISHER,
    REDIS_SUBSCRIBER,
    RedisService,
    RedisHealthService,
    PubSubService,
    CacheHelperService,
    // CacheModule,
  ],
})
export class RedisModule implements OnModuleDestroy {
  private readonly logger = new Logger(RedisModule.name);

  constructor(
    @Inject(REDIS_COMMAND) private readonly commandClient: Redis,
    @Inject(REDIS_PUBLISHER) private readonly publisherClient: Redis,
    @Inject(REDIS_SUBSCRIBER) private readonly subscriberClient: Redis,
  ) {}

  async onModuleDestroy(): Promise<void> {
    const results = await Promise.allSettled([
      this.commandClient.quit(),
      this.publisherClient.quit(),
      this.subscriberClient.quit(),
    ]);

    for (const result of results) {
      if (result.status === 'rejected') {
        this.logger.warn(`Redis shutdown warning: ${String(result.reason)}`);
      }
    }
  }
}
