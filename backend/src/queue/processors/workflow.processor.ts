import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { WORKFLOW_QUEUE } from '@/queue/queue.constants';
import { WorkflowJobData } from '@/queue/queue.types';

@Processor(WORKFLOW_QUEUE, {
  concurrency: 5,
})
export class WorkflowProcessor extends WorkerHost {
  private readonly logger = new Logger(WorkflowProcessor.name);

  async process(job: Job<WorkflowJobData>): Promise<void> {
    this.logger.log(
      `Processing workflow job ${job.id} for workflow ${job.data.workflowId}`,
    );

    // Add your workflow execution logic here.
  }
}
