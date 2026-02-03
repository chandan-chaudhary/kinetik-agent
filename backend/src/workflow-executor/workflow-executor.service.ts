import { Inject, Injectable } from '@nestjs/common';
import {
  StateGraph,
  START,
  MemorySaver,
  // CompiledStateGraph,
} from '@langchain/langgraph';
import { ChatOllama } from '@langchain/ollama';
import { stateSchema } from 'src/config/schemas'; //StateType
import { NodesService } from 'src/nodes/nodes.service';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { NodeType, Prisma } from '@prisma/client';
import llmConfig from '@/config/llm.config';
import type { ConfigType } from '@nestjs/config';
import { ChatGroq } from '@langchain/groq';

// Type for Workflow with included relations
type WorkflowWithRelations = Prisma.WorkflowGetPayload<{
  include: {
    nodes: true;
    connections: true;
  };
}>;

// Type for the compiled graph and checkpointer
type CompiledGraphResult = {
  graph: ReturnType<StateGraph<typeof stateSchema>['compile']>;
  checkpointer: MemorySaver;
};

@Injectable()
export class WorkflowExecutorService {
  private graphCache = new Map<string, CompiledGraphResult>();
  private llmInstance: BaseChatModel | null = null;

  constructor(
    @Inject(llmConfig.KEY)
    private readonly llmConfigService: ConfigType<typeof llmConfig>,
    private nodesService: NodesService,
  ) {}

  async onModuleInit() {
    // Small delay to ensure environment variables are loaded
    await new Promise((resolve) => setTimeout(resolve, 100));
    this.configureLLM();
  }
  /**
   * Build a dynamic LangGraph from a workflow definition
   * @param workflow - The workflow definition from the database
   * @returns Compiled LangGraph ready for execution
   */
  buildGraph(workflow: WorkflowWithRelations): CompiledGraphResult {
    console.log(`🔨 Building graph for workflow: ${workflow.name}`);

    // Check cache first
    if (this.graphCache.has(workflow.id)) {
      console.log('♻️  Using cached graph');
      return this.graphCache.get(workflow.id)!;
    }

    const checkpointer = new MemorySaver();
    const graph = new StateGraph(stateSchema);

    // Track which nodes need interruption
    const interruptNodes: string[] = [];

    // First, find and configure LLM node if present
    // const llmNode = workflow.nodes.find(
    //   (node) => node.type === NodeType.LLM_NODE,
    // );
    // if (llmNode) {
    //   this.configureLLM(llmNode);
    // }

    // Add all nodes to the graph
    for (const node of workflow.nodes) {
      console.log(`  Adding node: ${node.id} (${node.type})`);

      const graphNode = this.createNode(node);
      graph.addNode(node.id, graphNode);

      // Track approval nodes for interruption
      if (node.type === 'APPROVAL') {
        interruptNodes.push(node.id);
      }
    }

    // Find the trigger node (entry point)
    const triggerNode = workflow.nodes.find(
      (node) =>
        node.type === NodeType.SQL_QUERY_TRIGGER ||
        node.type === NodeType.INITIAL,
    );

    if (!triggerNode) {
      throw new Error(
        'No trigger node found. Please add a trigger node to start the workflow.',
      );
    }

    // Add edge from START to trigger node
    console.log(`  Adding edge: START → ${triggerNode.id}`);
    graph.addEdge(START, triggerNode.id as any);

    // Add all other edges from connections
    for (const edge of workflow.connections) {
      console.log(`  Adding edge: ${edge.fromNodeId} → ${edge.toNodeId}`);
      graph.addEdge(edge.fromNodeId as any, edge.toNodeId as any);
    }

    // Compile the graph
    const compiledGraph = graph.compile({
      checkpointer: checkpointer,
      // interruptBefore:
      //   interruptNodes.length > 0 ? (interruptNodes as any[]) : undefined,
    });

    console.log('✅ Graph compiled successfully');
    console.log(`   Nodes: ${workflow.nodes.length}`);
    console.log(`   Edges: ${workflow.connections.length}`);
    console.log(`   Interrupts: ${interruptNodes.join(', ') || 'none'}`);

    // Cache the graph
    const result: CompiledGraphResult = {
      graph: compiledGraph,
      checkpointer,
    };
    this.graphCache.set(workflow.id, result);

    return result;
  }

  /**
   * Create a LangGraph node based on node type and configuration
   * @param node - Node definition from workflow
   * @returns LangGraph node function
   */
  private createNode(node: WorkflowWithRelations['nodes'][number]) {
    switch (node.type) {
      case NodeType.SQL_QUERY_TRIGGER:
        // Database schema fetcher node
        return this.nodesService.getSchemaNode(
          (node?.data as { databaseUrl?: string })?.databaseUrl as string,
        );

      case NodeType.SQL_GENERATOR_ACTION: {
        // SQL generation node with LLM
        if (!this.llmInstance) {
          throw new Error(
            'LLM not configured. Please add an LLM_NODE to your workflow.',
          );
        }
        return this.nodesService.getSQLGeneratorNode(this.llmInstance);
      }

      case NodeType.SQL_EXECUTOR_ACTION: {
        // SQL execution node
        if (!this.llmInstance) {
          throw new Error(
            'LLM not configured. Please add an LLM_NODE to your workflow.',
          );
        }
        return this.nodesService.getSQLExecutorNode(this.llmInstance);
      }

      case NodeType.APPROVAL:
        // Human-in-the-loop approval node
        return this.nodesService.approvalNode();

      // case NodeType.SHOULD_CONTINUE:
      // case 'shouldContinue':
      //   // Conditional routing node
      //   // This is handled via conditional edges, not as a regular node
      //   throw new Error(
      //     'shouldContinue is not a node type - use conditional edges instead',
      //   );

      case NodeType.INITIAL:
        // Initial/trigger node - doesn't do anything, just starts the flow
        return () => {
          console.log('🚀 Initial node - workflow started');
          return {}; // Pass through state unchanged
        };

      case NodeType.LLM_NODE:
        // LLM configuration node - doesn't execute, just configures
        return () => {
          console.log('⚙️  LLM configured');
          return {}; // Pass through state unchanged
        };

      default:
        console.warn(
          `⚠️  Unknown node type: ${node.type as string}, creating pass-through node`,
        );
        return () => {
          console.log(`⚠️  Pass-through node: ${node.id}`);
          return {}; // Pass through state unchanged
        };
    }
  }

  /**
   * Configure LLM from LLM_NODE configuration
   * @param llmNode - The LLM configuration node
   */
  private configureLLM(): void {
    // const config = {}; //
    const model = this.llmConfigService.groqModel; //
    // const model = this.llmConfigService.groqModel; //

    const temperature = 0.7; //(config.temperature as number) ??

    console.log(`  🤖 Configuring LLM: ${model} (temp: ${temperature})`);

    // Currently only supporting Ollama, but can be extended for other providers
    // this.llmInstance = new ChatOllama({
    //   model: model,
    //   temperature: temperature,
    // });

    // Future: Support other providers based on config
    // if (config.provider === 'groq') {
    this.llmInstance = new ChatGroq({ model, temperature });
    // }
    // if (config.provider === 'openai') {
    //   this.llmInstance = new ChatOpenAI({ model, temperature });
    // }
  }

  // /**
  //  * Create an LLM instance based on configuration
  //  * @deprecated Use LLM_NODE instead
  //  * @param config - LLM configuration object
  //  * @returns BaseChatModel instance
  //  */
  // private createLLMInstance(config: any): BaseChatModel {
  //   const model = config.model || 'llama3.2';
  //   const temperature = config.temperature ?? 0.7;

  //   console.log(`  🤖 Creating LLM: ${model} (temp: ${temperature})`);

  //   // Currently only supporting Ollama, but can be extended for other providers
  //   return new ChatOllama({
  //     model: model,
  //     temperature: temperature,
  //   });

  //   // Future: Support other providers based on config
  //   // if (config.provider === 'groq') {
  //   //   return new ChatGroq({ model, temperature });
  //   // }
  //   // if (config.provider === 'openai') {
  //   //   return new ChatOpenAI({ model, temperature });
  //   // }
  // }

  /**
   * Clear the graph cache (useful when workflow is updated)
   * @param workflowId - Optional workflow ID to clear specific cache
   */
  clearCache(workflowId?: string) {
    if (workflowId) {
      console.log(`🗑️  Clearing cache for workflow: ${workflowId}`);
      this.graphCache.delete(workflowId);
    } else {
      console.log('🗑️  Clearing entire graph cache');
      this.graphCache.clear();
    }
    // Reset LLM instance when clearing cache
    this.llmInstance = null;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      cachedGraphs: this.graphCache.size,
      workflowIds: Array.from(this.graphCache.keys()),
    };
  }
}
