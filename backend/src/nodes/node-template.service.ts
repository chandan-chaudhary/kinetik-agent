import { Injectable, Logger } from '@nestjs/common';
import { NodeTemplateDto } from './dto/node-template.dto';
// Use plain string domains here to avoid unsafe enum member access at runtime

/**
 * Service to manage and provide node templates
 * These templates define what nodes are available for users to add to workflows
 */
@Injectable()
export class NodeTemplateService {
  private readonly logger = new Logger(NodeTemplateService.name);
  private templates: Map<string, NodeTemplateDto> = new Map();
  private builtInDomains: string[] = [];

  constructor() {
    this.initializeBuiltInTemplates();
    this.initializeBuiltInDomain();
  }

  /**
   * Initialize built-in node templates
   */
  private initializeBuiltInTemplates() {
    // SQL Domain Nodes
    this.registerTemplate({
      id: 'sql-schema',
      domain: 'sql',
      type: 'schema',
      fullType: 'sql.schema',
      name: 'Database Schema',
      description: 'Fetch database schema information',
      kind: 'action',
      icon: '🗄️',
      configSchema: {
        type: 'object',
        properties: {
          connectionString: {
            type: 'string',
            title: 'Connection String',
            description: 'PostgreSQL connection string',
          },
          includeViews: {
            type: 'boolean',
            title: 'Include Views',
            default: false,
          },
        },
        required: ['connectionString'],
      },
      inputSchema: {
        type: 'object',
        properties: {},
      },
      outputSchema: {
        type: 'object',
        properties: {
          schema: { type: 'string' },
        },
      },
      defaultConfig: {
        includeViews: false,
      },
    });

    this.registerTemplate({
      id: 'sql-generator',
      domain: 'sql',
      type: 'generator',
      fullType: 'sql.generator',
      name: 'SQL Generator',
      description: 'Generate SQL queries using LLM',
      kind: 'action',
      icon: '📝',
      configSchema: {
        type: 'object',
        properties: {
          model: {
            type: 'string',
            title: 'LLM Model',
            enum: [
              'gpt-4',
              'gpt-3.5-turbo',
              'claude-3-opus',
              'claude-3-sonnet',
            ],
            default: 'gpt-4',
          },
          temperature: {
            type: 'number',
            title: 'Temperature',
            minimum: 0,
            maximum: 2,
            default: 0.1,
          },
          systemPrompt: {
            type: 'string',
            title: 'System Prompt',
            description: 'Custom system prompt template',
            default:
              'You are a SQL expert. Generate SQL queries based on the user question and database schema.',
          },
          maxAttempts: {
            type: 'number',
            title: 'Max Attempts',
            minimum: 1,
            maximum: 10,
            default: 3,
          },
        },
        required: ['model'],
      },
      inputSchema: {
        type: 'object',
        properties: {
          userQuery: { type: 'string' },
          dbSchema: { type: 'string' },
        },
        required: ['userQuery'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          sql: { type: 'string' },
        },
      },
      defaultConfig: {
        model: 'gpt-4',
        temperature: 0.1,
        maxAttempts: 3,
      },
    });

    this.registerTemplate({
      id: 'sql-executor',
      domain: 'sql',
      type: 'executor',
      fullType: 'sql.executor',
      name: 'SQL Executor',
      description: 'Execute SQL queries against database',
      kind: 'action',
      icon: '⚡',
      configSchema: {
        type: 'object',
        properties: {
          connectionString: {
            type: 'string',
            title: 'Connection String',
            description: 'Database connection string',
          },
          timeout: {
            type: 'number',
            title: 'Query Timeout (ms)',
            default: 30000,
          },
        },
        required: ['connectionString'],
      },
      inputSchema: {
        type: 'object',
        properties: {
          sql: { type: 'string' },
        },
        required: ['sql'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          rows: { type: 'array' },
          rowCount: { type: 'number' },
        },
      },
      defaultConfig: {
        timeout: 30000,
      },
    });

    // LLM Domain Nodes
    this.registerTemplate({
      id: 'llm-chat',
      domain: 'llm',
      type: 'chat',
      fullType: 'llm.chat',
      name: 'LLM Chat',
      description: 'Chat with an LLM model',
      kind: 'action',
      icon: '🤖',
      configSchema: {
        type: 'object',
        properties: {
          model: {
            type: 'string',
            title: 'Model',
            enum: [
              'gpt-4',
              'gpt-3.5-turbo',
              'claude-3-opus',
              'claude-3-sonnet',
            ],
            default: 'gpt-4',
          },
          temperature: {
            type: 'number',
            title: 'Temperature',
            minimum: 0,
            maximum: 2,
            default: 0.7,
          },
          systemPrompt: {
            type: 'string',
            title: 'System Prompt',
            description: 'System message for the LLM',
          },
          maxTokens: {
            type: 'number',
            title: 'Max Tokens',
            minimum: 1,
            maximum: 4000,
          },
        },
        required: ['model'],
      },
      inputSchema: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
        required: ['message'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          response: { type: 'string' },
        },
      },
      defaultConfig: {
        model: 'gpt-4',
        temperature: 0.7,
      },
    });

    // Trading Domain Nodes
    this.registerTemplate({
      id: 'trading-price-trigger',
      domain: 'trading',
      type: 'priceTrigger',
      fullType: 'trading.priceTrigger',
      name: 'Price Trigger',
      description: 'Trigger workflow based on price conditions',
      kind: 'trigger',
      icon: '📊',
      configSchema: {
        type: 'object',
        properties: {
          asset: {
            type: 'string',
            title: 'Asset',
            enum: ['BTC', 'ETH', 'SOL'],
          },
          condition: {
            type: 'string',
            title: 'Condition',
            enum: ['above', 'below', 'crosses_above', 'crosses_below'],
            default: 'above',
          },
          price: {
            type: 'number',
            title: 'Price',
            minimum: 0,
          },
        },
        required: ['asset', 'price'],
      },
      inputSchema: {
        type: 'object',
        properties: {},
      },
      outputSchema: {
        type: 'object',
        properties: {
          triggered: { type: 'boolean' },
          currentPrice: { type: 'number' },
        },
      },
      defaultConfig: {
        condition: 'above',
      },
    });

    this.registerTemplate({
      id: 'trading-binance',
      domain: 'trading',
      type: 'binance',
      fullType: 'trading.binance',
      name: 'Binance Trade',
      description: 'Execute trade on Binance',
      kind: 'action',
      icon: '💰',
      configSchema: {
        type: 'object',
        properties: {
          symbol: {
            type: 'array',
            title: 'Trading Pair',
            items: {
              type: 'string',
              enum: ['BTC', 'ETH', 'SOL'],
            },
          },
          type: {
            type: 'array',
            title: 'Order Type',
            items: {
              type: 'string',
              enum: ['LONG', 'SHORT'],
            },
          },
          quantity: {
            type: 'number',
            title: 'Quantity',
            minimum: 0,
          },
          orderType: {
            type: 'string',
            title: 'Order Type',
            enum: ['market', 'limit'],
            default: 'market',
          },
        },
        required: ['symbol', 'type', 'quantity'],
      },
      inputSchema: {
        type: 'object',
        properties: {},
      },
      outputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          status: { type: 'string' },
        },
      },
      defaultConfig: {
        orderType: 'market',
      },
    });

    this.registerTemplate({
      id: 'trading-delta-exchange',
      domain: 'trading',
      type: 'deltaExchange',
      fullType: 'trading.deltaExchange',
      name: 'Delta Exchange Trade',
      description: 'Execute trade on Delta Exchange',
      kind: 'action',
      icon: '📈',
      configSchema: {
        type: 'object',
        properties: {
          symbol: {
            type: 'array',
            title: 'Trading Pair',
            items: {
              type: 'string',
              enum: ['BTC', 'ETH', 'SOL'],
            },
          },
          type: {
            type: 'array',
            title: 'Position Type',
            items: {
              type: 'string',
              enum: ['LONG', 'SHORT'],
            },
          },
          quantity: {
            type: 'number',
            title: 'Quantity',
            minimum: 0,
          },
        },
        required: ['symbol', 'type', 'quantity'],
      },
      inputSchema: {
        type: 'object',
        properties: {},
      },
      outputSchema: {
        type: 'object',
        properties: {
          orderId: { type: 'string' },
          status: { type: 'string' },
        },
      },
      defaultConfig: {},
    });

    this.logger.log(
      `Initialized ${this.templates.size} built-in node templates`,
    );
  }
  private initializeBuiltInDomain() {
    this.registerDomain('sql');
    this.registerDomain('trading');
    this.registerDomain('document');
    this.registerDomain('agent');
    this.registerDomain('llm');
    this.registerDomain('mixed');
  }

  registerDomain(domain: string) {
    if (!this.builtInDomains.includes(domain)) {
      this.builtInDomains.push(domain);
      this.logger.log(`Registered built-in domain: ${domain}`);
    }
  }
  /**
   * Register a new node template
   */
  registerTemplate(template: NodeTemplateDto): void {
    this.templates.set(template.fullType, template);
    this.logger.log(`Registered template: ${template.fullType}`);
  }

  /**
   * Get all node templates
   */
  getAllTemplates(): NodeTemplateDto[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by domain
   */
  getTemplatesByDomain(domain: string): NodeTemplateDto[] {
    return this.getAllTemplates().filter((t) => t.domain === domain);
  }

  /**
   * Get templates by kind
   */
  getTemplatesByKind(kind: string): NodeTemplateDto[] {
    return this.getAllTemplates().filter((t) => t.kind === kind);
  }

  /**
   * Get a specific template
   */
  getTemplate(fullType: string): NodeTemplateDto | undefined {
    return this.templates.get(fullType);
  }

  /**
   * Get templates grouped by domain
   */
  getTemplatesGroupedByDomain(): Record<string, NodeTemplateDto[]> {
    const grouped: Record<string, NodeTemplateDto[]> = {};

    for (const template of this.templates.values()) {
      if (!grouped[template.domain]) {
        grouped[template.domain] = [];
      }
      grouped[template.domain].push(template);
    }

    return grouped;
  }
}
