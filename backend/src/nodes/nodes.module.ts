import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { DatabaseNodesService } from './databaseNodes.service';
import { NodesController } from './nodes.controller';
import { TradingNodeService } from './trading-node/trading-node.service';
import { AlphaVantageService } from './alpha-vantage/alpha-vantage.service';

@Module({
  imports: [HttpModule],
  controllers: [NodesController],
  providers: [DatabaseNodesService, TradingNodeService, AlphaVantageService],
  exports: [DatabaseNodesService],
})
export class NodesModule {}
