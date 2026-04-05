import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { JobsOptions, Queue } from 'bullmq';
import { WORKFLOW_QUEUE } from '@/queue/queue.constants';
import { WorkflowJobData } from '@/queue/queue.types';

@Injectable()
export class QueueService {
  constructor(
    @InjectQueue(WORKFLOW_QUEUE) private readonly workflowQueue: Queue,
  ) {}

  async enqueueWorkflow(
    data: WorkflowJobData,
    options?: JobsOptions,
  ): Promise<string> {
    const job = await this.workflowQueue.add('workflow.execute', data, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: {
        age: 3600,
        count: 1000,
      },
      removeOnFail: {
        age: 24 * 3600,
        count: 2000,
      },
      ...options,
    });

    return job.id ?? '';
  }
}
