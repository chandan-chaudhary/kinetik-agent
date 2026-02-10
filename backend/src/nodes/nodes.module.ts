import { Module, forwardRef } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseNodesService } from './databaseNodes.service';
import { NodesController } from './nodes.controller';
import { TradingNodeService } from './trading-node/trading-node.service';
import { AlphaVantageService } from './alpha-vantage/alpha-vantage.service';
import { LlmModule } from '@/llm/llm.module';

@Module({
  imports: [HttpModule, forwardRef(() => LlmModule)],
  controllers: [NodesController],
  providers: [DatabaseNodesService, TradingNodeService, AlphaVantageService],
  exports: [DatabaseNodesService, TradingNodeService, AlphaVantageService],
})
export class NodesModule {}
