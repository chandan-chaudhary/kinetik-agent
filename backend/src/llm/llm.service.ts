import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ChatOllama } from '@langchain/ollama';
import type { ConfigType } from '@nestjs/config';
import llmConfig from 'src/config/llm.config';
import { ContentBlock, HumanMessage } from '@langchain/core/messages';
import {
  StateGraph,
  START,
  MemorySaver,
  END,
  Command,
} from '@langchain/langgraph';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { GraphResult, stateSchema, StateType } from 'src/config/schemas';
import { NodesService } from 'src/nodes/nodes.service';
// import { ChatGroq } from '@langchain/groq';

@Injectable()
export class LlmService implements OnModuleInit {
  public LLM: BaseChatModel;
  private agent!: ReturnType<typeof this.initGraph>;
  private checkpointer = new MemorySaver();
  constructor(
    @Inject(llmConfig.KEY)
    private LLMConfigService: ConfigType<typeof llmConfig>,
    private nodesService: NodesService,
  ) {}

  async onModuleInit() {
    // Small delay to ensure environment variables are loaded
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.initOllamaModel();
    this.agent = this.initGraph();
  }

  initOllamaModel() {
    this.LLM = new ChatOllama({
      model: this.LLMConfigService.ollamaModel,
      temperature: 0.7,
      // numPredict: 4096,
    });

    // this.LLM = new ChatGroq({
    //   model: this.LLMConfigService.groqModel,
    //   temperature: 0.5,
    // });
  }

  initGraph() {
    const graph = new StateGraph(stateSchema)
      .addNode('schema', this.nodesService.getSchemaNode())
      .addNode('sqlGenerator', this.nodesService.getSQLGeneratorNode(this.LLM))
      .addNode('sqlExecutor', this.nodesService.getSQLExecutorNode(this.LLM))
      .addNode('approval', this.nodesService.approvalNode(), {
        ends: ['sqlGenerator', '__end__'],
      })

      .addEdge(START, 'schema')
      .addEdge('schema', 'sqlGenerator')
      .addEdge('sqlGenerator', 'sqlExecutor')
      .addConditionalEdges(
        'sqlExecutor',
        this.nodesService.shouldContinueNode(),
        {
          sqlGenerator: 'sqlGenerator',
          approval: 'approval',
          __end__: END,
        },
      )
      .compile({
        checkpointer: this.checkpointer,
        // interruptBefore: ['approval'],
      });

    console.log(
      '📊 Graph compiled successfully with Command-based approval flow',
    );
    return graph;
  }

  async queryLLM(
    prompt: string,
  ): Promise<string | Record<string, any> | (ContentBlock | Text)[]> {
    console.log('🚀 Starting LLM query:', prompt);
    const threadId = `query_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const config = {
      configurable: {
        thread_id: threadId,
      },
    };

    const result = (await this.agent.invoke(
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
    const result = await this.agent.invoke(
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

  // Get the interrupt context (available after initial invoke)
  // async getInterruptContext(threadId: string): Promise<any> {
  //   const config = {
  //     configurable: { thread_id: threadId },
  //   };

  //   const state = await this.agent.getState(config);
  //   return state.values;
  // }
}
