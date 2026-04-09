import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { TEST_QUEUE } from '@/queue/queue.constants';
import { TestJobData } from '@/queue/queue.types';
import { ChatDatabaseService } from '@/chat-database/chat-database.service';
// import { TestMessage } from 'rxjs/internal/testing/TestMessage';

@Processor(TEST_QUEUE, {
  concurrency: 2,
})
export class TestQueueProcessor extends WorkerHost {
  private readonly logger = new Logger(TestQueueProcessor.name);
  constructor(private readonly chatDatabaseService: ChatDatabaseService) {
    super();
  }

  async process(job: Job<TestJobData>): Promise<any> {
    this.logger.log(`Processing test job ${job.id}`);
    // await new Promise<void>((resolve) =>
    //   setTimeout(() => {
    //     console.log(job.data.message);
    //     resolve();
    //   }, 5000),
    // ); // Simulate some work
    // this.logger.log(`Completed test job ${job.id}`);
    // Add your workflow execution logic here.
    return this.chatDatabaseService.queryDBgraph(job.data.prompt, {
      userId: job.data.user as string,
      ...job.data.body,
    });
  }
}
