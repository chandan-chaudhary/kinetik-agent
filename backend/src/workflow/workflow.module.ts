import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowExecutorService } from './workflow-executor.service';
import { DatabaseNodesService } from '@/nodes/databaseNodes.service';
import { LlmModule } from '@/llm/llm.module';

@Module({
  imports: [LlmModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowExecutorService, DatabaseNodesService],
})
export class WorkflowModule {}
