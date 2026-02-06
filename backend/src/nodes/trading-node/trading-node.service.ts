import { Injectable, Logger } from '@nestjs/common';
import { RSI } from 'technicalindicators';
import Alpaca from '@alpacahq/alpaca-trade-api';

// 1. Define strict interfaces for type safety
export interface MarketDataResult {
  ticker: string;
  price: number;
  dailyChange: number;
  rsi: number;
  isOverbought: boolean;
  isOversold: boolean;
  timestamp: string;
}

export interface AlpacaBar {
  Timestamp: string;
  OpenPrice: number;
  HighPrice: number;
  LowPrice: number;
  ClosePrice: number;
  Volume: number;
  TradeCount: number;
  VWAP: number;
}

@Injectable()
export class TradingNodeService {
  private readonly logger = new Logger(TradingNodeService.name);
  private readonly alpaca: Alpaca;

  constructor() {
    this.alpaca = new Alpaca({
      keyId: process.env.ALPACA_API_KEY || 'PK4QTAS4CFON2VTVFG5HC4YCBI',
      secretKey:
        process.env.ALPACA_API_SECRET ||
        '2FPnLp3Bvq5VD4XjnVVMrD1qUS68mA6738h4Edd8NaQh',
      paper: true,
      feed: 'iex',
    });
  }

  async getAssets() {
    try {
      const assets: unknown = await this.alpaca.getAssets();
      return assets;
    } catch (error) {
      this.logger.error(`Failed to fetch assets: ${error}`);
      throw error;
    }
  }

  async getMarketData({
    ticker,
    type,
  }: {
    ticker: string;
    type: 'stock' | 'crypto';
  }): Promise<MarketDataResult> {
    const isCrypto = type === 'crypto';
    if (isCrypto) {
      return this.getCryptoMarketData({ ticker });
    } else {
      return this.getStockMarketData({ ticker });
    }
  }
  /**
   * Fetches deep market metrics for a given ticker
   * @param ticker The stock symbol (e.g., 'AAPL')
   */
  async getStockMarketData({
    ticker,
  }: {
    ticker: string;
  }): Promise<MarketDataResult> {
    try {
      this.logger.log(`🚀 Fetching deep market data for ${ticker}...`);

      // 1. Get Snapshot with IEX feed (free tier)
      const snapshot = await this.alpaca.getSnapshot(ticker);

      const stockBarOptions = {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        timeframe: '1Day',
        feed: 'iex', // ← Add this!
        limit: 20,
      };

      // 2. Get Historical Bars with IEX feed
      const barsRequest = this.alpaca.getBarsV2(ticker, stockBarOptions);

      const closePrices: number[] = [];

      for await (const bar of barsRequest as AsyncIterable<AlpacaBar>) {
        closePrices.push(bar.ClosePrice);
      }

      if (closePrices.length < 14) {
        throw new Error(
          `Insufficient data for RSI calculation (needed 14, got ${closePrices.length})`,
        );
      }

      // 3. Calculate RSI
      const rsiValues: number[] = RSI.calculate({
        values: closePrices,
        period: 14,
      });
      const currentRsi = rsiValues[rsiValues.length - 1];

      // 4. Return strictly typed result
      return {
        ticker,
        price: snapshot.LatestTrade.Price,
        dailyChange: snapshot.DailyBar.ClosePrice - snapshot.DailyBar.OpenPrice,
        rsi: currentRsi,
        isOverbought: currentRsi > 70,
        isOversold: currentRsi < 30,
        timestamp: new Date(snapshot.LatestTrade.Timestamp).toISOString(),
      };
    } catch (error) {
      this.logger.error(`Failed to fetch market data for ${ticker}: ${error}`);
      throw error;
    }
  }
  async getCryptoMarketData({
    ticker,
  }: {
    ticker: string;
  }): Promise<MarketDataResult> {
    try {
      // Ensure proper crypto pair format (e.g., "BTC/USD")
      const cryptoPair = ticker; //ticker.includes('/') ? ticker : `${ticker}/USD`;

      this.logger.log(`🚀 Fetching crypto market data for ${cryptoPair}...`);

      // 1. Get Crypto Snapshots (note: returns a Map with symbols as keys)
      const snapshots = await this.alpaca.getCryptoSnapshots([cryptoPair]);
      console.log(snapshots);

      // Extract the snapshot for our specific crypto pair using Map.get()
      const snapshot = snapshots.get(cryptoPair);

      if (!snapshot) {
        throw new Error(`No snapshot data found for ${cryptoPair}`);
      }
      const CryptoOptions = {
        start: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        timeframe: this.alpaca.newTimeframe(1, this.alpaca.timeframeUnit.MIN),
      };
      // 2. Get Historical Crypto Bars (Last 20 days)
      const barsRequest = await this.alpaca.getCryptoBars(
        [cryptoPair],
        CryptoOptions,
      );

      const closePrices: number[] = [];

      const bars = barsRequest.get(cryptoPair) || [];
      for (const bar of bars) {
        console.log(bar);

        closePrices.push(bar.Close);
      }

      this.logger.log(
        `Collected ${closePrices.length} close prices for RSI calculation`,
      );

      if (closePrices.length < 14) {
        throw new Error(
          `Insufficient data for RSI calculation (needed 14, got ${closePrices.length})`,
        );
      }

      // 3. Calculate RSI
      const rsiValues: number[] = RSI.calculate({
        values: closePrices,
        period: 14,
      });

      if (!rsiValues || rsiValues.length === 0) {
        throw new Error('RSI calculation returned no values');
      }

      const currentRsi = rsiValues[rsiValues.length - 1];

      if (currentRsi === undefined || isNaN(currentRsi)) {
        throw new Error(`Invalid RSI value: ${currentRsi}`);
      }

      this.logger.log(`Calculated RSI: ${currentRsi}`);

      // 4. Return result
      return {
        ticker: cryptoPair,
        price: snapshot.LatestTrade.Price,
        dailyChange:
          (snapshot.DailyBar?.Close || 0) - (snapshot.DailyBar?.Open || 0),
        rsi: currentRsi,
        isOverbought: currentRsi > 70,
        isOversold: currentRsi < 30,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch crypto market data for ${ticker}: ${error}`,
      );
      throw error;
    }
  }
}
