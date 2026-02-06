import { Body, Controller, Get, Logger, Query } from '@nestjs/common';
import { DatabaseNodesService } from './databaseNodes.service';
import { TradingNodeService } from './trading-node/trading-node.service';
import { AlphaVantageService } from './alpha-vantage/alpha-vantage.service';

@Controller('nodes')
export class NodesController {
  private readonly logger = new Logger(NodesController.name);

  constructor(
    private readonly databaseNodesService: DatabaseNodesService,
    private readonly tradingNodeService: TradingNodeService,
    private readonly alphaVantageService: AlphaVantageService,
  ) {}

  @Get('assets')
  async getAssets() {
    try {
      this.logger.log(`Received request to fetch assets`);
      const assets = await this.tradingNodeService.getAssets();
      this.logger.log(`Successfully fetched assets`);
      console.log(assets);
      return assets;
    } catch (error) {
      this.logger.error(`Error fetching assets: ${error}`);
      throw error;
    }
  }

  // Example endpoint to fetch market data for a ticker
  @Get('market-data')
  async getMarketData(
    @Body() { ticker, type }: { ticker: string; type: 'stock' | 'crypto' },
  ) {
    try {
      this.logger.log(`Received request to fetch market data for ${ticker}`);
      const marketData = await this.tradingNodeService.getMarketData({
        ticker,
        type,
      });
      this.logger.log(`Successfully fetched market data for ${ticker}`);
      console.log(marketData);

      return marketData;
    } catch (error) {
      this.logger.error(`Error fetching market data for ${ticker}: ${error}`);
      throw error;
    }
  }

  @Get('quote')
  async getQuote(@Query('symbol') symbol: string) {
    try {
      this.logger.log(`Received request to fetch quote for ${symbol}`);
      const quote = await this.alphaVantageService.getGlobalQuote(symbol);
      this.logger.log(`Successfully fetched quote for ${symbol}`);
      console.table(quote);

      return quote;
    } catch (error) {
      this.logger.error(`Error fetching quote for ${symbol}: ${error}`);
      throw error;
    }
  }
}
