import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_PUBLISHER, REDIS_SUBSCRIBER } from '@/redis/redis.constants';

type PubSubHandler<T = unknown> = (payload: T) => Promise<void> | void;

interface EventEnvelope<T = unknown> {
  eventName: string;
  version: number;
  timestamp: string;
  traceId?: string;
  data: T;
}

@Injectable()
export class PubSubService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PubSubService.name);
  private readonly handlers = new Map<string, PubSubHandler>();

  constructor(
    @Inject(REDIS_PUBLISHER) private readonly publisherClient: Redis,
    @Inject(REDIS_SUBSCRIBER) private readonly subscriberClient: Redis,
  ) {}

  onModuleInit(): void {
    this.subscriberClient.on('message', async (channel, message) => {
      const handler = this.handlers.get(channel);
      if (!handler) {
        return;
      }

      try {
        const payload = JSON.parse(message);
        await handler(payload);
      } catch (error) {
        this.logger.error(
          `Failed to process pub/sub message for ${channel}`,
          error,
        );
      }
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.handlers.size === 0) {
      return;
    }

    await this.subscriberClient.unsubscribe(...this.handlers.keys());
    this.handlers.clear();
  }

  async publish<T>(
    channel: string,
    eventName: string,
    data: T,
    traceId?: string,
  ): Promise<number> {
    const envelope: EventEnvelope<T> = {
      eventName,
      version: 1,
      timestamp: new Date().toISOString(),
      traceId,
      data,
    };

    return this.publisherClient.publish(channel, JSON.stringify(envelope));
  }

  async subscribe<T = unknown>(
    channel: string,
    handler: PubSubHandler<EventEnvelope<T>>,
  ): Promise<void> {
    this.handlers.set(channel, handler as PubSubHandler);
    await this.subscriberClient.subscribe(channel);
  }

  async unsubscribe(channel: string): Promise<void> {
    this.handlers.delete(channel);
    await this.subscriberClient.unsubscribe(channel);
  }
}
