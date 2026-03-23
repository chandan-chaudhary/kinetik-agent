import { Injectable, Logger } from '@nestjs/common';
import { START, StateGraph, type GraphNode } from '@langchain/langgraph';
import { HumanMessage } from '@langchain/core/messages';
import { NodeType, Prisma } from '@prisma/client';
import {
  marketSchema,
  type GraphResult as MarketGraphResult,
  type MarketStateType,
} from '@/nodes/trading-node/marketSchema';
import { TradingNodeService } from '@/nodes/trading-node/trading-node.service';
import { TelegramService } from '@/telegram-bot/telegram-bot.service';
import { tavilyTool } from '@/tools/tavily.tool';

type WorkflowWithRelations = Prisma.WorkflowGetPayload<{
  include: {
    nodes: true;
    connections: true;
  };
}>;

type ExecuteWorkflowPayload = {
  prompt?: string;
  input?: unknown;
};

type MarketGraph = ReturnType<StateGraph<typeof marketSchema>['compile']>;

type CompiledGraphCacheItem = {
  graph: MarketGraph;
};

@Injectable()
export class WorkflowGraphExecutionService {
  private readonly logger = new Logger(WorkflowGraphExecutionService.name);

  // Cache compiled graphs by workflow version (id + updatedAt).
  private readonly compiledGraphCache = new Map<
    string,
    CompiledGraphCacheItem
  >();

  constructor(
    private readonly tradingNodeService: TradingNodeService,
    private readonly telegramService: TelegramService,
  ) {}

  /**
   * Executes a workflow with runtime payload.
   * Handles market workflows with LangGraph.
   */
  async executeWorkflow(
    workflow: WorkflowWithRelations,
    payload: ExecuteWorkflowPayload,
  ): Promise<Record<string, unknown>> {
    // Build or reuse the compiled graph for this exact workflow version.
    const cacheKey = this.getWorkflowCacheKey(workflow);
    const graphData = this.getOrCreateCompiledGraph(workflow, cacheKey);

    const initialState = this.buildInitialMarketState(payload);
    const executionResult = (await graphData.graph.invoke(
      initialState,
    )) as MarketGraphResult<MarketStateType>;

    // Return completed result with last message when available.
    const result = executionResult as Record<string, unknown>;
    if (
      result &&
      typeof result === 'object' &&
      'messages' in result &&
      Array.isArray(result.messages) &&
      result.messages.length > 0
    ) {
      const lastMessage = result.messages[result.messages.length - 1] as {
        content?: unknown;
      };

      return {
        completed: true,
        workflowId: workflow.id,
        content:
          typeof lastMessage.content === 'string'
            ? lastMessage.content
            : JSON.stringify(lastMessage.content ?? ''),
      };
    }

    return {
      completed: true,
      workflowId: workflow.id,
      result: executionResult,
    };
  }

  /**
   * Returns cached graph for a workflow version, else compiles a fresh one.
   */
  private getOrCreateCompiledGraph(
    workflow: WorkflowWithRelations,
    cacheKey: string,
  ): CompiledGraphCacheItem {
    if (this.compiledGraphCache.has(cacheKey)) {
      return this.compiledGraphCache.get(cacheKey)!;
    }

    const graph = this.buildMarketGraph(workflow);
    const compiled = { graph };
    this.compiledGraphCache.set(cacheKey, compiled);
    return compiled;
  }

  /**
   * Compiles market workflow graph with dynamic topology and runtime credentials.
   */
  private buildMarketGraph(workflow: WorkflowWithRelations): MarketGraph {
    const graph = new StateGraph(marketSchema);

    // Add all market nodes without hardcoding trigger/news entry nodes.
    for (const node of workflow.nodes) {
      graph.addNode(node.id, this.createMarketNode(node));
    }

    // Compute roots from graph structure (supports many START branches).
    const topology = this.getTopology(workflow);
    this.ensureNoCycle(topology.indegree, topology.adjacency, workflow);
    this.attachStartEdges(graph, topology.rootNodeIds);

    // Add explicit edges from persisted workflow connections.
    for (const connection of workflow.connections) {
      graph.addEdge(connection.fromNodeId as any, connection.toNodeId as any);
    }

    return graph.compile();
  }

  /**
   * Builds market node implementations using persisted node.data configuration.
   */
  private createMarketNode(
    node: WorkflowWithRelations['nodes'][number],
  ): GraphNode<typeof marketSchema> {
    const nodeData = node.data as Record<string, unknown>;

    switch (node.type) {
      case NodeType.MARKET_RESEARCH_TRIGGER: {
        // Set userQuery (ticker + type) from the node's persisted configuration.
        const ticker =
          (nodeData.ticker as string | undefined) ||
          (nodeData.symbol as string | undefined) ||
          'BTC/USD';
        const typeRaw = (nodeData.type as string | undefined) || 'stock';
        const type = typeRaw === 'crypto' ? 'crypto' : 'stock';
        return () => ({ userQuery: { ticker, type } });
      }

      case NodeType.ASSET_DATA_ACTION: {
        return this.tradingNodeService.getMarketData(nodeData);
      }

      case NodeType.NEWS_DATA_ACTION: {
        return (state: typeof marketSchema.State) =>
          tavilyTool(state, nodeData);
      }

      case NodeType.LLM_NODE: {
        return (state: typeof marketSchema.State) =>
          this.tradingNodeService.summarizeMarketData(state, nodeData);
      }

      case NodeType.TELEGRAM_ACTION: {
        return this.telegramService.sendToTelegram(nodeData);
      }

      case NodeType.INITIAL:
      default:
        return () => ({});
    }
  }

  /**
   * Creates START edges for all root nodes so user never has to hardcode trigger picks.
   */
  private attachStartEdges(
    graph: StateGraph<typeof marketSchema>,
    rootNodeIds: string[],
  ): void {
    if (rootNodeIds.length === 0) {
      throw new Error('Workflow has no executable root nodes.');
    }

    for (const rootId of rootNodeIds) {
      graph.addEdge(START, rootId as any);
    }
  }

  /**
   * Builds graph topology metadata (indegree + adjacency + roots).
   */
  private getTopology(workflow: WorkflowWithRelations): {
    indegree: Map<string, number>;
    adjacency: Map<string, string[]>;
    rootNodeIds: string[];
  } {
    const nodeIds = new Set(workflow.nodes.map((node) => node.id));
    const indegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();

    for (const node of workflow.nodes) {
      indegree.set(node.id, 0);
      adjacency.set(node.id, []);
    }

    for (const connection of workflow.connections) {
      if (
        !nodeIds.has(connection.fromNodeId) ||
        !nodeIds.has(connection.toNodeId)
      ) {
        throw new Error(
          `Invalid connection detected: ${connection.fromNodeId} -> ${connection.toNodeId}`,
        );
      }

      adjacency.get(connection.fromNodeId)!.push(connection.toNodeId);
      indegree.set(
        connection.toNodeId,
        (indegree.get(connection.toNodeId) || 0) + 1,
      );
    }

    // Roots are every node with no incoming edge.
    const rootNodeIds = workflow.nodes
      .filter((node) => (indegree.get(node.id) || 0) === 0)
      .map((node) => node.id);

    return { indegree, adjacency, rootNodeIds };
  }

  /**
   * Kahn's algorithm to detect cycles before graph compile.
   */
  private ensureNoCycle(
    indegree: Map<string, number>,
    adjacency: Map<string, string[]>,
    workflow: WorkflowWithRelations,
  ): void {
    const workingIndegree = new Map(indegree);
    const queue: string[] = [];

    for (const [nodeId, degree] of workingIndegree.entries()) {
      if (degree === 0) {
        queue.push(nodeId);
      }
    }

    let visited = 0;

    while (queue.length > 0) {
      const current = queue.shift()!;
      visited += 1;

      for (const next of adjacency.get(current) || []) {
        const updatedDegree = (workingIndegree.get(next) || 0) - 1;
        workingIndegree.set(next, updatedDegree);
        if (updatedDegree === 0) {
          queue.push(next);
        }
      }
    }

    if (visited !== workflow.nodes.length) {
      throw new Error(
        'Workflow contains a cycle. Please remove circular connections before execution.',
      );
    }
  }

  /**
   * Builds initial state for market workflows.
   */
  private buildInitialMarketState(
    payload: ExecuteWorkflowPayload,
  ): MarketStateType {
    const prompt = this.resolvePrompt(payload);

    return {
      messages: prompt
        ? [new HumanMessage(prompt)]
        : [new HumanMessage('Fetch market data for given ticker and type ')],
    } as MarketStateType;
  }

  /**
   * Returns workflow cache key scoped by workflow updated timestamp.
   */
  private getWorkflowCacheKey(workflow: WorkflowWithRelations): string {
    return `${workflow.id}:${workflow.updatedAt.toISOString()}`;
  }

  /**
   * Safely casts an unknown value to a plain object record.
   * Returns an empty object for null / primitive / array values.
   */
  private toRecord(value: unknown): Record<string, unknown> {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
    return {};
  }

  /**
   * Resolves prompt from payload using deterministic fallback order.
   */
  private resolvePrompt(payload: ExecuteWorkflowPayload): string {
    if (
      typeof payload.prompt === 'string' &&
      payload.prompt.trim().length > 0
    ) {
      return payload.prompt.trim();
    }

    if (typeof payload.input === 'string' && payload.input.trim().length > 0) {
      return payload.input.trim();
    }

    const inputRecord = this.toRecord(payload.input);
    if (
      typeof inputRecord.prompt === 'string' &&
      inputRecord.prompt.length > 0
    ) {
      return inputRecord.prompt;
    }

    return '';
  }

  /**
   * Streams workflow execution, emitting node_start / node_end / done / error
   * events via an async generator. Each node is instrumented at runtime so
   * the compiled graph cache is not affected.
   */
  async *streamWorkflow(
    workflow: WorkflowWithRelations,
    payload: ExecuteWorkflowPayload,
  ): AsyncGenerator<Record<string, unknown>> {
    const eventQueue: Record<string, unknown>[] = [];
    let streamDone = false;
    let wakeUp: (() => void) | null = null;

    const push = (event: Record<string, unknown>) => {
      eventQueue.push(event);
      wakeUp?.();
      wakeUp = null;
    };

    // Build a fresh instrumented graph (not cached) so wrappers are per-run.
    const graph = new StateGraph(marketSchema);
    for (const node of workflow.nodes) {
      const nodeId = node.id;
      const original = this.createMarketNode(node) as (
        state: typeof marketSchema.State,
      ) => Promise<Record<string, unknown>> | Record<string, unknown>;
      const instrumented = async (state: typeof marketSchema.State) => {
        push({ event: 'node_start', nodeId });
        try {
          const result = await original(state);
          push({ event: 'node_end', nodeId });
          return result;
        } catch (err) {
          push({ event: 'node_error', nodeId, message: String(err) });
          throw err;
        }
      };
      graph.addNode(nodeId, instrumented as any);
    }

    const topology = this.getTopology(workflow);
    this.ensureNoCycle(topology.indegree, topology.adjacency, workflow);
    this.attachStartEdges(graph, topology.rootNodeIds);
    for (const connection of workflow.connections) {
      graph.addEdge(connection.fromNodeId as any, connection.toNodeId as any);
    }
    const compiled = graph.compile();

    // Kick off graph execution in the background.
    compiled
      .invoke(this.buildInitialMarketState(payload))
      .then(() => {
        push({ event: 'done' });
        streamDone = true;
        wakeUp?.();
        wakeUp = null;
      })
      .catch((err: unknown) => {
        push({ event: 'error', message: String(err) });
        streamDone = true;
        wakeUp?.();
        wakeUp = null;
      });

    // Drain the event queue, waiting for new items when empty.
    while (true) {
      while (eventQueue.length > 0) {
        const evt = eventQueue.shift()!;
        yield evt;
        if (evt.event === 'done' || evt.event === 'error') return;
      }
      if (streamDone) break;
      await new Promise<void>((resolve) => {
        wakeUp = resolve;
      });
    }
  }
}
