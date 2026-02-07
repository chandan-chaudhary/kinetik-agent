import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { LanggraphService } from './langgraph/langgraph.service';
import { NodesModule } from 'src/nodes/nodes.module';
import { TradingNodeService } from '@/nodes/trading-node/trading-node.service';

@Module({
  providers: [LlmService, LanggraphService, TradingNodeService],
  imports: [NodesModule],
  exports: [LlmService, LanggraphService, TradingNodeService],
})
export class LlmModule {}
