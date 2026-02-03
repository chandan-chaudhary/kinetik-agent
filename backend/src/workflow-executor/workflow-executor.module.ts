import { Module } from '@nestjs/common';
import { WorkflowExecutorService } from './workflow-executor.service';
import { NodesModule } from '../nodes/nodes.module';

@Module({
  imports: [NodesModule],
  providers: [WorkflowExecutorService],
  exports: [WorkflowExecutorService],
})
export class WorkflowExecutorModule {}
