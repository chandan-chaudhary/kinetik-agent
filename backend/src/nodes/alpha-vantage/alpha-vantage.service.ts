import { Injectable, HttpStatus, Logger, Inject } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { ConfigType } from '@nestjs/config';
import marketApiConfig from '@/config/market-api.config';
import axios, { AxiosResponse } from 'axios';
import { createError, customError } from '@/common/customError';

// Define strict interfaces for our LangGraph nodes
export interface StockQuote {
  symbol: string;
  price: number;
  high: number;
  low: number;
  volume: number;
  latestTradingDay: string;
  previousClose: number;
  changePercent: string;
}

interface SymbolMatch {
  '1. symbol': string;
  '2. name': string;
  '3. type': string;
  '4. region': string;
  '8. currency': string;
}

interface SymbolSearchResponse {
  bestMatches: SymbolMatch[];
}

export interface TickerSearchResult {
  symbol: string;
  name: string;
  type: string;
  region: string;
  currency: string;
}

@Injectable()
export class AlphaVantageService {
  private readonly logger = new Logger(AlphaVantageService.name);
  private readonly baseUrl = 'https://www.alphavantage.co/query';

  constructor(
    private readonly httpService: HttpService,
    @Inject(marketApiConfig.KEY)
    private readonly marketApiConfiguration: ConfigType<typeof marketApiConfig>,
  ) {}

  /**
   * GLOBAL_QUOTE: Get real-time price data for any global ticker
   * Works for: "AAPL" (US) or "RELIANCE.BSE" (India)
   */
  async getGlobalQuote(symbol: string): Promise<StockQuote> {
    try {
      const params = {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: this.marketApiConfiguration.alphaVantageApiKey,
      };

      const data = await this.makeRequest(params);

      // Alpha Vantage returns data under a "Global Quote" key
      const quote = data['Global Quote'] as Record<string, any>;
      console.log(quote, 'in vantage');

      if (!quote || Object.keys(quote).length === 0) {
        throw createError(`Ticker ${symbol} not found or rate limit hit.`, {
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }

      // Parse and validate numeric fields to avoid NaN values
      const price = parseFloat(quote['05. price'] as string);
      const high = parseFloat(quote['03. high'] as string);
      const low = parseFloat(quote['04. low'] as string);
      const volume = parseInt(quote['06. volume'] as string);
      const previousClose = parseFloat(quote['08. previous close'] as string);
      if (
        isNaN(price) ||
        isNaN(high) ||
        isNaN(low) ||
        isNaN(volume) ||
        isNaN(previousClose)
      ) {
        throw createError(`Invalid data received for ticker ${symbol}.`, {
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      }

      return {
        symbol: quote['01. symbol'] as string,
        price,
        high,
        low,
        volume,
        latestTradingDay: quote['07. latest trading day'] as string,
        previousClose,
        changePercent: quote['10. change percent'] as string,
      };
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: `Failed to fetch quote for ${symbol}`,
      });
    }
  }

  /**
   * DYNAMIC INDICATOR: Fetch any technical indicator (RSI, SMA, EMA)
   */
  async getTechnicalIndicator(
    symbol: string,
    indicator: 'RSI' | 'SMA' | 'EMA',
    interval: 'daily' | 'weekly' = 'daily',
  ) {
    try {
      const params = {
        function: indicator,
        symbol: symbol,
        interval: interval,
        time_period: 14,
        series_type: 'close',
        apikey: this.marketApiConfiguration.alphaVantageApiKey,
      };

      const data = await this.makeRequest(params);
      const metaDataKey = `Technical Analysis: ${indicator}`;
      const timeSeries = data[metaDataKey] as Record<
        string,
        Record<string, string>
      >;

      if (!timeSeries) {
        throw createError(`Failed to fetch ${indicator} for ${symbol}`, {
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      }

      // Get the most recent date entry
      const latestDate = Object.keys(timeSeries)[0];
      return {
        date: latestDate,
        value: parseFloat(timeSeries[latestDate][indicator]),
      };
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: `Failed to fetch ${indicator} indicator for ${symbol}`,
      });
    }
  }

  /**
   * SEARCH: Dynamic ticker search for Indian or Global markets
   */
  async searchTicker(keywords: string): Promise<TickerSearchResult[]> {
    try {
      const params = {
        function: 'SYMBOL_SEARCH',
        keywords: keywords,
        apikey: this.marketApiConfiguration.alphaVantageApiKey,
      };

      const data = await this.makeRequest(params);
      const response = data as SymbolSearchResponse;
      const matches = response.bestMatches || [];

      return matches.map((m: SymbolMatch) => ({
        symbol: m['1. symbol'],
        name: m['2. name'],
        type: m['3. type'],
        region: m['4. region'],
        currency: m['8. currency'],
      }));
    } catch (error) {
      throw customError(error, {
        fallbackStatus: HttpStatus.INTERNAL_SERVER_ERROR,
        fallbackMessage: 'Failed to search tickers',
      });
    }
  }

  /**
   * Private Helper: Handles API calls, logging, and Alpha Vantage's
   * "Success-but-actually-Error" responses (like rate limits).
   */
  private async makeRequest(params: Record<string, any>) {
    try {
      const response: AxiosResponse = await axios.get(this.baseUrl, { params });
      const data = response.data as Record<string, any>; // Explicitly type data to avoid unsafe assignment

      // Alpha Vantage returns 200 OK even for errors/limitations
      if (data['Note']) {
        this.logger.warn(`Alpha Vantage Rate Limit: ${data['Note']}`);
        throw createError('API Rate limit reached (25/day). Please wait.', {
          httpStatus: HttpStatus.TOO_MANY_REQUESTS,
        });
      }

      if (data['Error Message']) {
        throw createError(`Alpha Vantage Error: ${data['Error Message']}`, {
          httpStatus: HttpStatus.BAD_REQUEST,
        });
      }

      return data;
    } catch (error) {
      this.logger.error(`Request Failed: ${error}`);
      throw customError(error, {
        fallbackStatus: HttpStatus.SERVICE_UNAVAILABLE,
        fallbackMessage: 'Alpha Vantage request failed',
      });
    }
  }
}
