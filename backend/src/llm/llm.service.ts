import { Inject, Injectable, OnModuleInit, forwardRef } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import llmConfig from '@/config/llm.config';
import { HumanMessage } from '@langchain/core/messages';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { GraphResult, CompiledGraph } from '@/config/schemas';
import { LanggraphService } from '../langgraph/langgraph.service';
import { ChatOllama } from '@langchain/ollama';
import { ChatGroq } from '@langchain/groq';
import { MarketStateType } from '@/nodes/trading-node/marketSchema';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { CredentailsService } from '@/credentails/credentails.service';

type LlmCredentialResolved = {
  provider: string;
  model: string | null;
  apiKey: string | null;
};

type CredentialResolverService = {
  resolveById(credentialId: string): Promise<LlmCredentialResolved | null>;
};
@Injectable()
export class LlmService implements OnModuleInit {
  public LLM!: BaseChatModel;
  private marketAgent!: CompiledGraph;

  constructor(
    @Inject(llmConfig.KEY)
    private LLMConfigService: ConfigType<typeof llmConfig>,
    @Inject(forwardRef(() => LanggraphService))
    private langgraphService: LanggraphService,
    @Inject(CredentailsService)
    private readonly credentailsService: CredentialResolverService,
  ) {}

  async onModuleInit() {
    // Small delay to ensure environment variables are loaded
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.marketAgent = this.langgraphService.initMarketGraph();
  }

  // initLLMModel() {
  //   // Bootstrap the global fallback LLM from env — used by legacy paths.
  //   this.LLM = new ChatGroq({
  //     model: this.LLMConfigService.groqModel,
  //     temperature: 0.7,
  //   });
  // }

  /**
   * Factory: builds a fresh LLM instance from node data.
   *
   * Reads from nodeData (set by the user in the workflow node config):
   *   provider / llmProvider  → 'groq' | 'google' | 'google-genai' | 'ollama'
   *   model    / llmModel     → specific model name
   *   apiKey   / groqApiKey   → key for Groq
   *   apiKey   / googleApiKey → key for Google
   *   temperature             → sampling temperature (default 0.7)
   *
   * Falls back to env-configured values when nodeData fields are absent,
   * so existing workflows without explicit credentials keep working.
   */
  async getLLMInstance(
    nodeData: Record<string, unknown> = {},
  ): Promise<BaseChatModel> {
    const credentialId =
      (nodeData.credentialId as string | undefined) ||
      (nodeData.llmCredentialId as string | undefined);

    let credential: LlmCredentialResolved | null = null;

    if (credentialId) {
      const resolvedCredential =
        await this.credentailsService.resolveById(credentialId);
      if (resolvedCredential) {
        credential = {
          provider: resolvedCredential.provider,
          model: resolvedCredential.model,
          apiKey: resolvedCredential.apiKey,
        };
      }
    }
    console.log(credential);

    // Resolve provider: node config wins, then env default.
    const providerRaw =
      (nodeData.llmProvider as string | undefined) ||
      (nodeData.provider as string | undefined) ||
      credential?.provider ||
      this.LLMConfigService.groqModelProvider;

    const provider = (providerRaw || '').toLowerCase();

    // Generic model and temperature overrides from node config.
    const modelOverride =
      (nodeData.llmModel as string | undefined) ||
      (nodeData.model as string | undefined) ||
      credential?.model ||
      undefined;

    const temperature =
      typeof nodeData.temperature === 'number' ? nodeData.temperature : 0.7;

    switch (provider) {
      case 'google':
      case 'google-genai': {
        // Use node-level Google API key, fall back to env.
        const apiKey =
          (nodeData.googleApiKey as string | undefined) ||
          (nodeData.apiKey as string | undefined) ||
          credential?.apiKey ||
          this.LLMConfigService.googleApiKey;
        const model = modelOverride || this.LLMConfigService.googleModel;
        return (this.LLM = new ChatGoogleGenerativeAI({
          model,
          apiKey,
          temperature,
        }));
      }

      case 'ollama': {
        // Ollama is local — no API key required.
        const model = modelOverride || this.LLMConfigService.ollamaModel;
        return (this.LLM = new ChatOllama({ model, temperature }));
      }

      case 'groq':
      default: {
        // Use node-level Groq API key, fall back to env.
        const apiKey =
          (nodeData.groqApiKey as string | undefined) ||
          (nodeData.apiKey as string | undefined) ||
          credential?.apiKey ||
          this.LLMConfigService.groqApiKey;
        const model = modelOverride || this.LLMConfigService.groqModel;
        return (this.LLM = new ChatGroq({ model, apiKey, temperature }));
      }
    }
  }

  // Deprecated: only for legacy paths that expect a global LLM instance. New code should call getLLMInstance() directly.
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
        userQuery: { ticker, type: type as 'crypto' | 'stock' },
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
