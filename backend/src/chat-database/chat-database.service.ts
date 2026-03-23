import { CompiledGraph, GraphResult, StateType } from '@/config/schemas';
import { LanggraphService } from '@/langgraph/langgraph.service';
import { LlmService } from '@/llm/llm.service';
import { ContentBlock, HumanMessage } from '@langchain/core/messages';
import { Command } from '@langchain/langgraph';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ChatDatabaseService {
  constructor(
    private readonly langgraphService: LanggraphService,
    private readonly llmService: LlmService,
  ) {}

  async queryDBgraph(
    prompt: string,
    config: {
      llmProvider?: string;
      credentialId?: string;
      // model?: string;
      // apiKey?: string;
      databaseUrl?: string;
      dbType?: string;
    } = {},
  ): Promise<string | Record<string, any> | (ContentBlock | Text)[]> {
    console.log('🚀 Initialize LLM:', config.llmProvider);
    await this.llmService.getLLMInstance({
      llmProvider: config.llmProvider,
      credentialId: config.credentialId,
    });
    console.log('🚀 Initlizing langgarph :', config.databaseUrl);

    // Build a fresh graph per-request so databaseUrl and dbType are wired in correctly
    const dbAgent: CompiledGraph = this.langgraphService.initDatabaseGraph(
      config.databaseUrl,
      (config.dbType as 'postgres' | 'mongodb') ?? 'postgres',
    );

    console.log('🚀 Starting LLM query:', prompt);
    const threadId = `query_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const invokeConfig = {
      configurable: {
        thread_id: threadId,
      },
    };

    const result = (await dbAgent.invoke(
      {
        messages: [new HumanMessage(prompt)],
        userQuery: prompt,
        sqlAttempts: 0,
        approved: false,
      },
      invokeConfig,
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
    return result as unknown as string;
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

    // Re-build graph with shared checkpointer — schema node won't re-run on resume
    const dbAgent: CompiledGraph = this.langgraphService.initDatabaseGraph();

    // Resume with the decision using Command pattern
    const result = await dbAgent.invoke(
      new Command({ resume: { approved, feedback } }),
      config,
    );

    console.log(
      '✅ Resume completed:',
      (result as GraphResult<StateType>).approved ? 'Approved' : 'Regenerating',
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
    return result;
  }
}
