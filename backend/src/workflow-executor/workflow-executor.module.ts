import { Module } from '@nestjs/common';
import { WorkflowExecutorService } from './workflow-executor.service';
import { NodesModule } from '../nodes/nodes.module';
import { LlmModule } from '../llm/llm.module';

@Module({
  imports: [NodesModule, LlmModule],
  providers: [WorkflowExecutorService],
  exports: [WorkflowExecutorService],
})
export class WorkflowExecutorModule {}
