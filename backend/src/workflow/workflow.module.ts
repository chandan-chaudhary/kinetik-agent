import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { WorkflowGraphExecutionService } from './workflow-graph-execution.service';
import { LlmModule } from '@/llm/llm.module';
import { NodesModule } from '@/nodes/nodes.module';

@Module({
  imports: [LlmModule, NodesModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowGraphExecutionService],
})
export class WorkflowModule {}
