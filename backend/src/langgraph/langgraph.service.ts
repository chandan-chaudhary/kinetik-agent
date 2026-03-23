import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { StateGraph, START, MemorySaver, END } from '@langchain/langgraph';
import { stateSchema, CompiledGraph } from '@/config/schemas';
import { DatabaseNodesService } from '@/chat-database/databaseNodes.service';
import { LlmService } from '../llm/llm.service';
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

  initDatabaseGraph(
    databaseUrl?: string,
    dbType: 'postgres' | 'mongodb' = 'postgres',
  ): CompiledGraph {
    const isPostgres = dbType !== 'mongodb';

    const graph = new StateGraph(stateSchema)
      .addNode('schema', this.dbNodesService.getSchemaNode(databaseUrl, dbType))
      .addNode(
        'queryGenerator',
        isPostgres
          ? this.dbNodesService.getSQLGeneratorNode(() => this.llmService.LLM)
          : this.dbNodesService.getMongoQueryGeneratorNode(
              () => this.llmService.LLM,
            ),
      )
      .addNode(
        'queryExecutor',
        isPostgres
          ? this.dbNodesService.getSQLExecutorNode(
              () => this.llmService.LLM,
              databaseUrl,
            )
          : this.dbNodesService.getMongoExecutorNode(
              () => this.llmService.LLM,
              databaseUrl,
            ),
      )
      .addNode('approval', this.dbNodesService.approvalNode(), {
        ends: ['queryGenerator', '__end__'],
      })

      .addEdge(START, 'schema')
      .addEdge('schema', 'queryGenerator')
      .addEdge('queryGenerator', 'queryExecutor')
      .addConditionalEdges(
        'queryExecutor',
        this.dbNodesService.shouldContinueNode(),
        {
          sqlGenerator: 'queryGenerator',
          approval: 'approval',
          __end__: END,
        },
      )
      .compile({
        checkpointer: this.checkpointer,
        interruptBefore: ['approval'],
      }) as CompiledGraph;

    console.log(
      `📊 Graph compiled [${dbType}] with Command-based approval flow`,
    );
    return graph;
  }

  initMarketGraph(): CompiledGraph {
    const graph = new StateGraph(marketSchema)
      .addNode('marketData', this.marketNodesService.getMarketData())
      .addNode('scrapeNews', (state) => tavilyTool(state))
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
      }) as CompiledGraph;
    return graph;
  }
}
