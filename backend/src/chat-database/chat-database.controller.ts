import {
  Body,
  Controller,
  Get,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ChatDatabaseService } from './chat-database.service';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '@/types/auth.types';
import type { DbType, LlmProvider } from '@/types/chat-config.types';
import { TEST_QUEUE } from '@/queue/queue.constants';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';

@UseGuards(AuthGuard('jwt'))
@Controller('chat-database')
export class ChatDatabaseController implements OnModuleInit, OnModuleDestroy {
  private queueEvents!: QueueEvents;

  constructor(
    private readonly chatDatabaseService: ChatDatabaseService,
    @InjectQueue(TEST_QUEUE)
    private readonly queue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    this.queueEvents = new QueueEvents(TEST_QUEUE, {
      connection: this.queue.opts.connection,
      prefix: this.queue.opts.prefix,
    });

    await this.queueEvents.waitUntilReady();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.queueEvents) {
      await this.queueEvents.close();
    }
  }

  // @Post('query-dbgraph')
  // async queryDBgraph(
  //   @Body()
  //   body: {
  //     prompt: string;
  //     llmProvider?: string;
  //     credentialId?: string;
  //     model?: string;
  //     apiKey?: string;
  //     databaseUrl?: string;
  //     dbType?: string;
  //   },
  // ): Promise<any> {
  //   const { prompt, llmProvider, credentialId, databaseUrl, dbType } = body;
  //   const response = await this.chatDatabaseService.queryDBgraph(prompt, {
  //     llmProvider,
  //     credentialId,
  //     // model,
  //     // apiKey,
  //     databaseUrl,
  //     dbType,
  //   });
  //   console.log(response);
  //   return response;
  // }
  @Post('test-queue')
  async testQueue(): Promise<string> {
    await this.queue.add('test-job', { message: 'Hello from the queue!' });
    return 'Queue test endpoint hit';
  }

  @Post('query-dbgraph')
  async queryDBgraph(
    @Body()
    body: {
      prompt: string;
      sessionId: string; // NEW — required
      llmProvider?: LlmProvider;
      credentialId?: string;
      model?: string;
      apiKey?: string;
      databaseUrl?: string;
      dbType?: DbType;
    },
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const {
      prompt,
      sessionId,
      llmProvider,
      credentialId,
      model,
      apiKey,
      databaseUrl,
      dbType,
    } = body;
    const job = await this.queue.add('test-job', {
      user: req.user!.userId,
      prompt: prompt,
      body: {
        sessionId,
        llmProvider,
        credentialId,
        model,
        apiKey,
        databaseUrl,
        dbType,
      },
    });

    // Hybrid strategy: return real data for fast jobs, otherwise return jobId for polling.
    try {
      const result: unknown = await job.waitUntilFinished(
        this.queueEvents,
        25000,
      );
      return result;
    } catch (error) {
      if (error instanceof Error && error.message.includes('timed out')) {
        return {
          status: 'processing',
          jobId: job.id,
          message:
            'Job accepted and still processing. Poll /chat-database/query-dbgraph/:jobId for completion.',
        };
      }

      throw error;
    }
  }

  @Get('query-dbgraph/:jobId')
  async getQueryDBgraphResult(@Param('jobId') jobId: string): Promise<any> {
    const job = await this.queue.getJob(jobId);

    if (!job) {
      throw new NotFoundException(`Job ${jobId} was not found`);
    }

    const state = await job.getState();

    if (state === 'completed') {
      const returnValue: unknown = job.returnvalue;
      return {
        status: state,
        jobId,
        data: returnValue,
      };
    }

    if (state === 'failed') {
      return {
        status: state,
        jobId,
        error: job.failedReason,
      };
    }

    return {
      status: state,
      jobId,
      message: 'Job is still in progress',
    };
  }

  @Post('approve')
  async approve(
    @Body() body: { threadId: string; approved: boolean; feedback?: string },
    // @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const { threadId, approved, feedback } = body;
    return this.chatDatabaseService.resumeWithApproval(
      threadId,
      approved,
      feedback,
    );
  }
}
