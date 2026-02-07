import { Inject, Injectable, Logger } from '@nestjs/common';
import { RSI } from 'technicalindicators';
import Alpaca from '@alpacahq/alpaca-trade-api';
import marketApiConfig from '@/config/market-api.config';
import type { ConfigType } from '@nestjs/config';
import { marketSchema } from './marketSchema';
import { GraphNode } from '@langchain/langgraph';
import { chromium } from 'playwright-extra';
import { ElementHandle } from 'playwright';
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

  constructor(
    @Inject(marketApiConfig.KEY)
    private readonly marketApiSettings: ConfigType<typeof marketApiConfig>,
  ) {
    this.alpaca = new Alpaca({
      keyId: this.marketApiSettings.alpacaApiKey,
      secretKey: this.marketApiSettings.alpacaApiSecret,
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

  getMarketData(): GraphNode<typeof marketSchema> {
    return async (state: typeof marketSchema.State) => {
      const isCrypto = state.userQuery?.type === 'crypto';
      if (isCrypto) {
        const result = await this.getCryptoMarketData({
          ticker: state.userQuery?.ticker,
        });
        return { marketLiveData: result };
      } else {
        const result = await this.getStockMarketData({
          ticker: state.userQuery?.ticker,
        });
        return { marketLiveData: result };
      }
    };
  }

  // GET MARKET NEWS AND SENTIMENT
  scrapeNews(): GraphNode<typeof marketSchema> {
    return async (state: typeof marketSchema.State) => {
      const browser = await chromium.launch({
        headless: true,
        channel: 'chrome',
      });
      const context = await browser.newContext({
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      });
      const page = await context.newPage();

      // Block unnecessary resources
      await page.route('**/*', (route) => {
        const type = route.request().resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
          return route.abort();
        }
        return route.continue();
      });

      try {
        const ticker = state.userQuery?.ticker || '';
        this.logger.log(`Searching for ticker: ${ticker}...`);

        // Navigate to Google Finance
        await page.goto('https://www.google.com/finance', {
          waitUntil: 'networkidle',
          timeout: 30000,
        });

        // Wait for page to be fully loaded
        await page.waitForTimeout(2000);

        // Find all search inputs and use the first visible one
        const searchInputs = await page.$$('input.Ax4B8.ZAGvjd[type="text"]');

        let searchInput: ElementHandle<SVGElement | HTMLElement> | null = null;
        for (const input of searchInputs) {
          const isVisible = await input.isVisible();
          if (isVisible) {
            searchInput = input;
            this.logger.log('Found visible search input');
            break;
          }
        }

        if (!searchInput) {
          throw new Error('Could not find visible search input');
        }

        // Click and fill the search input
        await searchInput.click();
        await page.waitForTimeout(500);
        await searchInput.fill(ticker);

        this.logger.log(`Typed "${ticker}" into search box`);

        // Wait for autocomplete dropdown
        await page.waitForTimeout(2000);

        // Press Arrow Down and Enter to select first result
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');

        this.logger.log('Pressed Enter on search result');

        // Wait for navigation
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        this.logger.log(`Successfully navigated to ${ticker} page`);

        // Wait for news section
        await page.waitForSelector('.zLrlHb', {
          timeout: 15000,
          state: 'visible',
        });

        // Scrape news items
        const newsItems = await page.evaluate(() => {
          const newsElements = document.querySelectorAll('.zLrlHb');
          console.log(`Found ${newsElements.length} news items`);

          return Array.from(newsElements)
            .slice(0, 10)
            .map((el) => {
              const title =
                el.querySelector('.F2KAFc')?.textContent?.trim() || '';
              const source =
                el.querySelector('.AYBNIb')?.textContent?.trim() || '';
              const time =
                el.querySelector('.HzW5e')?.textContent?.trim() || '';
              const link =
                el.querySelector('a.TxRU9d')?.getAttribute('href') || '';

              return { title, source, time, link };
            })
            .filter((item) => item.title && item.title.length > 0);
        });

        console.log(`Scraped ${newsItems.length} news items:`, newsItems);

        if (newsItems.length === 0) {
          await page.screenshot({
            path: `debug-${ticker}-${Date.now()}.png`,
            fullPage: true,
          });
          this.logger.warn(`No news found. Screenshot saved.`);
        }

        return { newsSentiment: newsItems };
      } catch (e) {
        this.logger.error(`Scraping failed: ${e}`);

        try {
          await page.screenshot({
            path: `error-${Date.now()}.png`,
            fullPage: true,
          });
          this.logger.log('Error screenshot saved');
        } catch (screenshotError) {
          console.log(screenshotError);

          // Ignore
        }

        return { newsSentiment: [] };
      } finally {
        await browser.close();
      }
    };
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
        timeframe: this.alpaca.newTimeframe(1, this.alpaca.timeframeUnit.DAY),
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
        timeframe: this.alpaca.newTimeframe(1, this.alpaca.timeframeUnit.DAY),
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
