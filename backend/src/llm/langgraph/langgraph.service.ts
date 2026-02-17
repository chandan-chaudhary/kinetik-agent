import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { StateGraph, START, MemorySaver, END } from '@langchain/langgraph';
import { stateSchema } from '@/config/schemas';
import { DatabaseNodesService } from '@/nodes/databaseNodes.service';
import { LlmService } from '../llm.service';
import { TradingNodeService } from '@/nodes/trading-node/trading-node.service';
import { marketSchema } from '@/nodes/trading-node/marketSchema';
import { tavilyTool } from '@/tools/tavily.tool';
import { TelegramService } from '@/telegram-bot/telegram-bot.service';

@Injectable()
export class LanggraphService {
  private checkpointer = new MemorySaver();

  constructor(
    private dbNodesService: DatabaseNodesService,
    private telegramService: TelegramService,
    @Inject(forwardRef(() => TradingNodeService))
    private marketNodesService: TradingNodeService,
    @Inject(forwardRef(() => LlmService))
    private readonly llmService: LlmService,
  ) {}

  initDatabaseGraph(): any {
    const databse = 'DATABASE_URL_PLACEHOLDER';
    const graph = new StateGraph(stateSchema)
      .addNode('schema', this.dbNodesService.getSchemaNode(databse))
      .addNode(
        'sqlGenerator',
        this.dbNodesService.getSQLGeneratorNode(this.llmService.LLM),
      )
      .addNode(
        'sqlExecutor',
        this.dbNodesService.getSQLExecutorNode(this.llmService.LLM),
      )
      .addNode('approval', this.dbNodesService.approvalNode(), {
        ends: ['sqlGenerator', '__end__'],
      })

      .addEdge(START, 'schema')
      .addEdge('schema', 'sqlGenerator')
      .addEdge('sqlGenerator', 'sqlExecutor')
      .addConditionalEdges(
        'sqlExecutor',
        this.dbNodesService.shouldContinueNode(),
        {
          sqlGenerator: 'sqlGenerator',
          approval: 'approval',
          __end__: END,
        },
      )
      .compile({
        checkpointer: this.checkpointer,
        interruptBefore: ['approval'],
      });

    console.log(
      '📊 Graph compiled successfully with Command-based approval flow',
    );
    return graph;
  }

  initMarketGraph(): any {
    const graph = new StateGraph(marketSchema)
      .addNode('marketData', this.marketNodesService.getMarketData())
      .addNode('scrapeNews', tavilyTool)
      .addNode('sendTelegram', this.telegramService.sendToTelegram())
      .addNode('summarise', (state) =>
        this.marketNodesService.summarizeMarketData(state),
      )
      .addEdge(START, 'marketData')
      .addEdge(START, 'scrapeNews')
      .addEdge('marketData', END)
      .addEdge('scrapeNews', 'summarise')
      .addEdge('summarise', 'sendTelegram')
      .addEdge('sendTelegram', END)
      .compile({
        checkpointer: this.checkpointer,
      });
    return graph;
  }
}
