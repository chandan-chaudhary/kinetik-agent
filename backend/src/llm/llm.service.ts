import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import llmConfig from '@/config/llm.config';
import { ContentBlock, HumanMessage } from '@langchain/core/messages';
import { Command } from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { GraphResult, StateType } from '@/config/schemas';
import { LanggraphService } from './langgraph/langgraph.service';
// import { ChatOllama } from '@langchain/ollama';
import { ChatGroq } from '@langchain/groq';
import { MarketStateType } from '@/nodes/trading-node/marketSchema';
// import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
@Injectable()
export class LlmService implements OnModuleInit {
  public LLM!: BaseChatModel;
  private dbAgent!: ReturnType<typeof this.langgraphService.initDatabaseGraph>;
  private marketAgent!: ReturnType<
    typeof this.langgraphService.initMarketGraph
  >;

  constructor(
    @Inject(llmConfig.KEY)
    private LLMConfigService: ConfigType<typeof llmConfig>,
    private langgraphService: LanggraphService,
  ) {}

  async onModuleInit() {
    // Small delay to ensure environment variables are loaded
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.initLLMModel();
    this.dbAgent = this.langgraphService.initDatabaseGraph();
    this.marketAgent = this.langgraphService.initMarketGraph();
  }

  initLLMModel() {
    // this.LLM = new ChatOllama({
    //   model: this.LLMConfigService.ollamaModel,
    //   temperature: 0.7,
    //   // numPredict: 4096,
    // });

    // this.LLM = new ChatGoogleGenerativeAI({
    //   model: this.LLMConfigService.googleModel,
    //   temperature: 0.7,
    // });

    this.LLM = new ChatGroq({
      model: this.LLMConfigService.groqModel,
      temperature: 0.7,
    });
  }

  async queryDBgraph(
    prompt: string,
  ): Promise<string | Record<string, any> | (ContentBlock | Text)[]> {
    console.log('🚀 Starting LLM query:', prompt);
    const threadId = `query_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const config = {
      configurable: {
        thread_id: threadId,
      },
    };

    const result = (await this.dbAgent.invoke(
      {
        messages: [new HumanMessage(prompt)],
        userQuery: prompt,
        sqlAttempts: 0,
        approved: false,
      },
      config,
    )) as GraphResult<StateType>;

    console.log('📥 Agent result:', typeof result, Object.keys(result));

    // Check if interrupted
    // const resultWithInterrupt = result as any;
    if (result.__interrupt__ && result.__interrupt__.length > 0) {
      console.log('⏸️ Execution interrupted for approval');
      console.log('Interrupt context:', result.__interrupt__);
      return {
        interrupted: true,
        threadId: threadId,
        context: result.__interrupt__[0]?.value,
        state: result,
      };
    }

    if (result && typeof result === 'object' && 'messages' in result) {
      const messages = (result as { messages: { content: string }[] }).messages;
      console.log(
        '📝 Final message:',
        messages[messages.length - 1].content.slice(0, 100),
      );
      return {
        completed: true,
        threadId: threadId,
        content: messages[messages.length - 1].content,
        // state: result,
      };
    }
    return result as string;
  }

  // Resume execution after human approval
  async resumeWithApproval(
    threadId: string,
    approved: boolean,
    feedback?: string,
  ): Promise<string | Record<string, any> | (ContentBlock | Text)[]> {
    console.log('🔄 Resuming with approval:', approved, 'feedback:', feedback);

    const config = {
      configurable: { thread_id: threadId },
    };

    // Resume with the decision using Command pattern
    const result = await this.dbAgent.invoke(
      new Command({ resume: { approved, feedback } }),
      config,
    );

    console.log(
      '✅ Resume completed:',
      result.approved ? 'Approved' : 'Regenerating',
    );
    if (result && typeof result === 'object' && 'messages' in result) {
      const messages = (result as { messages: { content: string }[] }).messages;
      console.log(
        '📝 Final message:',
        messages[messages.length - 1].content.slice(0, 100),
      );
      return {
        completed: true,
        threadId: threadId,
        content: messages[messages.length - 1].content,
        // state: result,
      };
    }
    return result as string;
  }

  async queryMarketGraph({ ticker, type }: { ticker: string; type: string }) {
    console.log('🚀 Starting MarketGraph query:', ticker, type);
    const threadId = `market_query_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const config = {
      configurable: {
        thread_id: threadId,
      },
    };

    const result = (await this.marketAgent.invoke(
      {
        messages: [
          new HumanMessage(`Fetch market data for ${ticker} of type ${type}`),
        ],
        userQuery: { ticker, type: type as 'crypto' | 'stocks' },
      },
      config,
    )) as GraphResult<MarketStateType>;
    console.log('📥 MarketGraph result:', typeof result, Object.keys(result));

    if (result && typeof result === 'object' && 'messages' in result) {
      console.log(result);

      const messages = (result as { messages: { content: string }[] }).messages;
      console.log(
        '📝 Final message:',
        messages[messages.length - 1].content.slice(0, 100),
      );
      return {
        completed: true,
        threadId: threadId,
        content: messages[messages.length - 1].content,
        state: {
          marketLiveData: result.marketLiveData,
          // news: result.news,
          summarised: result.summarised,
        },
      };
    }
    return result as string;
  }
}
