import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import type { RedisConfig } from '@/config/redis.config';
import { QueueService } from '@/queue/queue.service';
import { WorkflowProcessor } from '@/queue/processors/workflow.processor';
import { WORKFLOW_QUEUE } from '@/queue/queue.constants';

@Module({
  imports: [
    ConfigModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redis = configService.getOrThrow<RedisConfig>('redis');

        return {
          connection: {
            host: redis.host,
            port: redis.port,
            username: redis.username,
            password: redis.password,
            db: redis.db,
            ...(redis.tls ? { tls: redis.tls } : {}),
          },
          prefix: redis.bullPrefix,
        };
      },
    }),
    BullModule.registerQueue({
      name: WORKFLOW_QUEUE,
    }),
  ],
  providers: [QueueService, WorkflowProcessor],
  exports: [QueueService],
})
export class QueueModule {}
