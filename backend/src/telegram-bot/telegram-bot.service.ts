// src/services/telegram.service.ts
import marketApiConfig from '@/config/market-api.config';
import {
  marketSchema,
  MarketStateType,
} from '@/nodes/trading-node/marketSchema';
import { MarketDataResult } from '@/nodes/trading-node/trading-node.service';
import { GraphNode } from '@langchain/langgraph';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import axios, { AxiosError } from 'axios';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface TelegramMessageOptions {
  chatId: string | number;
  text: string;
  parseMode?: 'HTML' | 'Markdown' | 'MarkdownV2';
  entities?: MessageEntity[];
  linkPreviewOptions?: LinkPreviewOptions;
  disableNotification?: boolean;
  protectContent?: boolean;
  replyParameters?: ReplyParameters;
  replyMarkup?: InlineKeyboardMarkup | ReplyKeyboardMarkup;
}

export interface MessageEntity {
  type: string;
  offset: number;
  length: number;
  url?: string;
  user?: any;
  language?: string;
}

export interface LinkPreviewOptions {
  isDisabled?: boolean;
  url?: string;
  preferSmallMedia?: boolean;
  preferLargeMedia?: boolean;
  showAboveText?: boolean;
}

export interface ReplyParameters {
  messageId: number;
  chatId?: string | number;
  allowSendingWithoutReply?: boolean;
  quote?: string;
}

export interface InlineKeyboardMarkup {
  inline_keyboard: InlineKeyboardButton[][];
}

export interface InlineKeyboardButton {
  text: string;
  url?: string;
  callback_data?: string;
}

export interface ReplyKeyboardMarkup {
  keyboard: KeyboardButton[][];
  isPersistent?: boolean;
  resizeKeyboard?: boolean;
  oneTimeKeyboard?: boolean;
}

export interface KeyboardButton {
  text: string;
}

export interface TelegramResponse {
  ok: boolean;
  result?: any;
  description?: string;
  error_code?: number;
}

// ============================================================================
// TELEGRAM SERVICE
// ============================================================================

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly botToken: string;
  private readonly baseUrl: string;

  constructor(
    @Inject(marketApiConfig.KEY)
    private readonly config: ConfigType<typeof marketApiConfig>,
  ) {
    this.botToken = this.config.telegramBotToken || '';
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;

    if (!this.botToken) {
      this.logger.warn('TELEGRAM_BOT_TOKEN not found in environment variables');
    }
  }

  /**
   * Telegram Node: Formats and sends market data + news to Telegram
   */
  sendToTelegram(): GraphNode<typeof marketSchema> {
    return async (state: typeof marketSchema.State) => {
      try {
        const chatId = this.config.telegramChatId;

        if (!chatId) {
          this.logger.warn('TELEGRAM_CHAT_ID not configured, skipping send');
          return {
            error: 'Telegram chat ID not configured',
          };
        }
        this.logger.log(
          'Preparing to send market report to Telegram...',
          chatId,
        );
        // Format the combined report
        const formattedMessage = this.formatMarketReport(state);

        // Send to Telegram
        await this.sendMessage({
          chatId,
          text: formattedMessage,
          parseMode: 'HTML',
          //   disableWebPagePreview: true,
        });

        this.logger.log('Successfully sent market report to Telegram');

        return {
          telegramSentStatus: 'Successfully sent market report to Telegram',
        };
      } catch (error) {
        this.logger.error(`Failed to send to Telegram: ${error}`);
        return {
          error: `Telegram send failed: ${error}`,
        };
      }
    };
  }
  /**
   * Send a message to Telegram using the Bot API
   * @see https://core.telegram.org/bots/api#sendmessage
   */
  async sendMessage(
    options: TelegramMessageOptions,
  ): Promise<TelegramResponse> {
    if (!this.botToken) {
      this.logger.error('TELEGRAM_BOT_TOKEN is not set');
      throw new Error('TELEGRAM_BOT_TOKEN is required');
    }

    const url = `${this.baseUrl}/sendMessage`;

    // Build request payload according to official API specs
    const payload: Record<string, any> = {
      chat_id: options.chatId,
      text: options.text,
    };

    // Optional parameters (only add if provided)
    if (options.parseMode) {
      payload.parse_mode = options.parseMode;
    }

    if (options.entities) {
      payload.entities = options.entities;
    }

    if (options.linkPreviewOptions) {
      payload.link_preview_options = {
        is_disabled: options.linkPreviewOptions.isDisabled,
        url: options.linkPreviewOptions.url,
        prefer_small_media: options.linkPreviewOptions.preferSmallMedia,
        prefer_large_media: options.linkPreviewOptions.preferLargeMedia,
        show_above_text: options.linkPreviewOptions.showAboveText,
      };
    }

    if (options.disableNotification !== undefined) {
      payload.disable_notification = options.disableNotification;
    }

    if (options.protectContent !== undefined) {
      payload.protect_content = options.protectContent;
    }

    if (options.replyParameters) {
      payload.reply_parameters = {
        message_id: options.replyParameters.messageId,
        chat_id: options.replyParameters.chatId,
        allow_sending_without_reply:
          options.replyParameters.allowSendingWithoutReply,
        quote: options.replyParameters.quote,
      };
    }

    if (options.replyMarkup) {
      payload.reply_markup = options.replyMarkup;
    }

    try {
      const response = await axios.post<TelegramResponse>(url, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      });

      if (response.data.ok) {
        this.logger.log(
          `✅ Message sent successfully to chat ${options.chatId}`,
        );
        return response.data;
      } else {
        this.logger.error(
          `❌ Telegram API error: ${response.data.description}`,
        );
        return response.data;
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<TelegramResponse>;

        if (axiosError.response) {
          this.logger.error(
            `❌ Telegram API error (${axiosError.response.status}): ${axiosError.response.data.description}`,
          );
          return axiosError.response.data;
        } else if (axiosError.request) {
          this.logger.error('❌ No response from Telegram API');
        } else {
          this.logger.error(`❌ Error: ${axiosError.message}`);
        }
      }

      throw error;
    }
  }

  /**
   * Format market data into a Telegram-friendly HTML message
   */
  formatMarketData(marketData: MarketDataResult): string {
    if (!marketData) {
      return '❌ <b>No market data available</b>';
    }

    const {
      ticker,
      price,
      dailyChange,
      rsi,
      isOverbought,
      isOversold,
      //   volume,
      //   high24h,
      //   low24h,
    } = marketData;

    const changeEmoji = dailyChange >= 0 ? '📈' : '📉';
    const changeColor = dailyChange >= 0 ? '🟢' : '🔴';

    let rsiStatus = '🟡 <b>Neutral</b>';
    if (isOverbought) {
      rsiStatus = '🔴 <b>Overbought</b> (Sell Signal)';
    } else if (isOversold) {
      rsiStatus = '🟢 <b>Oversold</b> (Buy Signal)';
    }

    let message = `📊 <b>Market Data: ${ticker}</b>\n`;
    message += `${'─'.repeat(20)}\n\n`;

    // Price section
    if (price !== undefined) {
      message += `💰 <b>Current Price:</b> $${price.toFixed(2)}\n`;
    }

    if (dailyChange !== undefined) {
      const sign = dailyChange >= 0 ? '+' : '';
      message += `${changeEmoji} <b>24h Change:</b> ${changeColor} ${sign}${dailyChange.toFixed(2)}%\n`;
    }

    // if (high24h !== undefined || low24h !== undefined) {
    //   message += `\n📉 <b>24h Range</b>\n`;
    //   if (high24h) message += `   ↑ High: $${high24h.toFixed(2)}\n`;
    //   if (low24h) message += `   ↓ Low: $${low24h.toFixed(2)}\n`;
    // }

    // if (volume !== undefined) {
    //   message += `\n📊 <b>Volume:</b> ${this.formatVolume(volume)}\n`;
    // }

    // RSI section
    if (rsi !== undefined) {
      message += `\n📈 <b>Technical Indicators</b>\n`;
      message += `   RSI: ${rsi.toFixed(2)}\n`;
      message += `   Status: ${rsiStatus}\n`;
    }

    message += `\n⏰ <i>Updated: ${new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short',
    })} UTC</i>`;

    return message;
  }

  /**
   * Format news data for Telegram
   */
  formatNewsData(newsData: MarketStateType['news']): string {
    if (!newsData) {
      return '❌ <b>No news available</b>';
    }

    const { content } = newsData;

    // For dynamic content, extract a concise summary
    const lines = (content as string).split('\n');
    let summary = '';
    let charCount = 0;
    const maxChars = 1200; // Leave room for sources and formatting

    // Take the first meaningful content, skipping headers
    for (const line of lines) {
      if (line.startsWith('#') || line.trim() === '') continue; // Skip headers and empty lines

      if (charCount + line.length > maxChars) {
        summary += line.slice(0, maxChars - charCount) + '...';
        break;
      }

      summary += line + '\n';
      charCount += line.length + 1;

      // Stop at reasonable sections (after first 2-3 paragraphs)
      if (summary.split('\n\n').length > 3) break;
    }

    let message = `📰 <b>Market News Summary</b>\n`;
    message += `${'─'.repeat(20)}\n\n`;

    message += `${summary}\n\n`;

    // // Add sources (limited to avoid length)
    // if (sources && Array.isArray(sources) && sources.length > 0) {
    //   message += `🔗 <b>Sources:</b>\n`;
    //   const maxSources = 3; // Limit to prevent message length issues
    //   for (let i = 0; i < Math.min(sources.length, maxSources); i++) {
    //     const source = sources[i] as { title: string };
    //     message += `• ${this.escapeHtml(source.title)}\n`;
    //   }
    //   if (sources.length > maxSources) {
    //     message += `• ...and ${sources.length - maxSources} more\n`;
    //   }
    // }

    message += `\n⏰ <i>Updated: ${new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'medium',
      timeStyle: 'short',
    })} UTC</i>`;

    return message;
  }

  /**
   * Format a combined market report with data and news
   */
  formatMarketReport(state: MarketStateType): string {
    // let report = `🚀 <b>MARKET REPORT</b>\n`;
    // report += `${'═'.repeat(20)}\n\n`;

    // report += this.formatMarketData(state.marketLiveData as MarketDataResult);

    // if (state.news) {
    //   report += `\n\n${'═'.repeat(20)}\n\n`;
    //   report += this.formatNewsData(state.news);
    // }
    const summarised = state.summarised;
    console.log('sending to bot', summarised);

    return JSON.stringify(summarised);
  }

  /**
   * Create inline keyboard buttons for interactive messages
   */
  createInlineKeyboard(
    buttons: Array<{ text: string; url?: string; callbackData?: string }>,
  ): InlineKeyboardMarkup {
    return {
      inline_keyboard: [
        buttons.map((btn) => ({
          text: btn.text,
          url: btn.url,
          callback_data: btn.callbackData,
        })),
      ],
    };
  }

  // ============================================================================
  // PRIVATE UTILITY METHODS
  // ============================================================================

  /**
   * Escape HTML special characters for Telegram HTML parse mode
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Format large numbers (volume, market cap, etc.)
   */
  private formatVolume(volume: number): string {
    if (volume >= 1_000_000_000) {
      return `$${(volume / 1_000_000_000).toFixed(2)}B`;
    } else if (volume >= 1_000_000) {
      return `$${(volume / 1_000_000).toFixed(2)}M`;
    } else if (volume >= 1_000) {
      return `$${(volume / 1_000).toFixed(2)}K`;
    }
    return `$${volume.toFixed(2)}`;
  }
}
