import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LanggraphService } from './langgraph/langgraph.service';
import { NodesModule } from 'src/nodes/nodes.module';

@Module({
  providers: [LlmService, LanggraphService],
  imports: [NodesModule],
  exports: [LlmService, LanggraphService],
})
export class LlmModule {}
