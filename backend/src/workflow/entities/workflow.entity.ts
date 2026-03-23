export class Workflow {}

// import { Injectable, Logger } from '@nestjs/common';
// import {
//   StateGraph,
//   START,
//   MemorySaver,
//   END,
//   type GraphNode,
// } from '@langchain/langgraph';
// import { stateSchema } from '@/config/schemas';
// import { DatabaseNodesService } from '@/chat-database/databaseNodes.service';
// import { NodeType, Prisma } from '@prisma/client';
// import { LlmService } from '@/llm/llm.service';
// import { TradingNodeService } from '@/nodes/trading-node/trading-node.service';
// import { TelegramService } from '@/telegram-bot/telegram-bot.service';
// import { marketSchema } from '@/nodes/trading-node/marketSchema';
// import { tavilyTool } from '@/tools/tavily.tool';

// type WorkflowWithRelations = Prisma.WorkflowGetPayload<{
//   include: {
//     nodes: true;
//     connections: true;
//   };
// }>;

// type CompiledGraphResult = {
//   graph: ReturnType<StateGraph<typeof stateSchema>['compile']>;
//   checkpointer: MemorySaver;
// };

// type MarketCompiledGraphResult = {
//   graph: ReturnType<StateGraph<typeof marketSchema>['compile']>;
//   checkpointer: MemorySaver;
// };

// type AnyCompiledGraphResult = CompiledGraphResult | MarketCompiledGraphResult;

// @Injectable()
// export class WorkflowExecutorService {
//   private readonly logger = new Logger(WorkflowExecutorService.name);
//   private graphCache = new Map<string, AnyCompiledGraphResult>();

//   constructor(
//     private dbNodesService: DatabaseNodesService,
//     private llmService: LlmService,
//     private tradingNodeService: TradingNodeService,
//     private telegramService: TelegramService,
//   ) {}

//   /**
//    * Smart router — inspects the workflow's trigger node type and delegates
//    * to the appropriate graph builder. All caching is handled here once.
//    */
//   buildGraph(workflow: WorkflowWithRelations): AnyCompiledGraphResult {
//     this.logger.log(`🔨 Building graph for workflow: ${workflow.name}`);

//     if (this.graphCache.has(workflow.id)) {
//       this.logger.log('♻️  Using cached graph');
//       return this.graphCache.get(workflow.id)!;
//     }

//     const isMarketWorkflow = workflow.nodes.some(
//       (n) => n.type === NodeType.MARKET_RESEARCH_TRIGGER,
//     );

//     if (isMarketWorkflow) {
//       this.logger.log(
//         '📈 Detected market workflow — delegating to buildMarketGraph()',
//       );
//       return this.buildMarketGraph(workflow);
//     }

//     this.logger.log(
//       '🗄️ Detected database workflow — delegating to buildDatabaseGraph()',
//     );
//     return this.buildDatabaseGraph(workflow);
//   }

//   /**
//    * Builds a SQL / generic state-machine graph from the DB workflow definition.
//    * Supports conditional edges, APPROVAL interrupts, and CONDITION routing.
//    */
//   private buildDatabaseGraph(
//     workflow: WorkflowWithRelations,
//   ): CompiledGraphResult {
//     const checkpointer = new MemorySaver();
//     const graph = new StateGraph(stateSchema);

//     for (const node of workflow.nodes) {
//       this.logger.debug(`  Adding node: ${node.id} (${node.type})`);
//       const graphNode = this.createDataBaseNode(node);
//       graph.addNode(node.id, graphNode);
//     }

//     const triggerNode = workflow.nodes.find(
//       (node) =>
//         node.type === NodeType.SQL_QUERY_TRIGGER ||
//         node.type === NodeType.INITIAL,
//     );

//     if (!triggerNode) {
//       throw new Error('No trigger node found. Please add a trigger node.');
//     }

//     this.logger.log(`🚀 Entry point: START → ${triggerNode.id}`);
//     graph.addEdge(START, triggerNode.id as any);

//     this.addDynamicEdges(graph, workflow);

//     const compiledGraph = graph.compile({ checkpointer });

//     this.logger.log('✅ Database graph compiled successfully');
//     this.logger.log(`   Nodes: ${workflow.nodes.length}`);
//     this.logger.log(`   Edges: ${workflow.connections.length}`);

//     const result: CompiledGraphResult = { graph: compiledGraph, checkpointer };
//     this.graphCache.set(workflow.id, result);
//     return result;
//   }

//   // ─── Market Graph ────────────────────────────────────────────────────────

//   /**
//    * Builds a market analysis graph from the DB workflow definition.
//    * Uses marketSchema (ticker, marketData, newsData, summary) as state.
//    * Topology mirrors initMarketGraph():
//    *   START ──► marketData ──► END
//    *   START ──► scrapeNews ──► summarise ──► sendTelegram ──► END
//    */
//   private buildMarketGraph(
//     workflow: WorkflowWithRelations,
//   ): MarketCompiledGraphResult {
//     this.logger.log(`📈 Building market graph for workflow: ${workflow.name}`);

//     const checkpointer = new MemorySaver();
//     const graph = new StateGraph(marketSchema);

//     // Add nodes from the DB workflow
//     for (const node of workflow.nodes) {
//       this.logger.debug(`  Adding market node: ${node.id} (${node.type})`);
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//       const graphNode = this.createMarketNode(node);
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//       graph.addNode(node.id, graphNode);
//     }

//     // Find the trigger node — it is the START entry point
//     const triggerNode = workflow.nodes.find(
//       (n) => n.type === NodeType.MARKET_RESEARCH_TRIGGER,
//     );

//     if (!triggerNode) {
//       throw new Error(
//         'No MARKET_RESEARCH_TRIGGER node found in market workflow.',
//       );
//     }

//     // Find the news-scraping node (parallel branch from START)
//     const newsNode = workflow.nodes.find(
//       (n) => n.type === NodeType.NEWS_DATA_ACTION,
//     );

//     // Wire START → trigger (market data) and START → news (parallel)
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//     graph.addEdge(START, triggerNode.id as any);
//     if (newsNode) {
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//       graph.addEdge(START, newsNode.id as any);
//     }

//     // Add remaining edges from DB connections (skip edges already from START)
//     for (const conn of workflow.connections) {
//       this.logger.debug(`  Edge: ${conn.fromNodeId} → ${conn.toNodeId}`);
//       // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
//       graph.addEdge(conn.fromNodeId as any, conn.toNodeId as any);
//     }

//     const compiledGraph = graph.compile({ checkpointer });

//     this.logger.log('✅ Market graph compiled successfully');
//     this.logger.log(`   Nodes: ${workflow.nodes.length}`);
//     this.logger.log(`   Edges: ${workflow.connections.length}`);

//     const result: MarketCompiledGraphResult = {
//       graph: compiledGraph,
//       checkpointer,
//     };
//     this.graphCache.set(workflow.id, result);
//     return result;
//   }

//   /**
//    * Maps DB NodeType to the correct market graph node implementation.
//    */
//   private createMarketNode(node: WorkflowWithRelations['nodes'][number]): any {
//     switch (node.type) {
//       case NodeType.MARKET_RESEARCH_TRIGGER: {
//         const nodeData = node.data as Record<string, unknown>;
//         // Fetches live market data (price, RSI, etc.) for the configured ticker
//         return this.tradingNodeService.getMarketData(nodeData);
//       }

//       case NodeType.NEWS_DATA_ACTION: {
//         const nodeData = node.data as Record<string, unknown>;
//         // Runs Tavily web research in parallel with market data
//         return (state: typeof marketSchema.State) =>
//           tavilyTool(state, nodeData);
//       }

//       case NodeType.LLM_NODE: {
//         const nodeData = node.data as Record<string, unknown>;
//         // Summarises market data + news via LLM
//         return (state: typeof marketSchema.State) =>
//           this.tradingNodeService.summarizeMarketData(state, nodeData);
//       }

//       case NodeType.TELEGRAM_ACTION: {
//         const nodeData = node.data as Record<string, unknown>;
//         // Sends the final summary to the configured Telegram chat
//         return this.telegramService.sendToTelegram(nodeData);
//       }

//       default:
//         this.logger.warn(
//           `⚠️ Unknown market node type: ${node.type} — using pass-through`,
//         );
//         return () => ({});
//     }
//   }

//   // ─── SQL / Generic Graph ─────────────────────────────────────────────────

//   private createDataBaseNode(
//     node: WorkflowWithRelations['nodes'][number],
//   ): GraphNode<typeof stateSchema> {
//     const nodeData = node.data as Record<string, unknown>;

//     switch (node.type) {
//       case NodeType.SQL_QUERY_TRIGGER: {
//         const databaseUrl = (nodeData?.databaseUrl as string) || '';
//         return this.dbNodesService.getSchemaNode(databaseUrl);
//       }

//       case NodeType.SQL_GENERATOR_ACTION: {
//         if (!this.llmService.LLM) {
//           throw new Error('LLM not configured. Please configure LLM.');
//         }
//         return this.dbNodesService.getSQLGeneratorNode(this.llmService.LLM);
//       }

//       case NodeType.SQL_EXECUTOR_ACTION: {
//         if (!this.llmService.LLM) {
//           throw new Error('LLM not configured. Please configure LLM.');
//         }
//         return this.dbNodesService.getSQLExecutorNode(this.llmService.LLM);
//       }

//       case NodeType.APPROVAL: {
//         // const nodeId = '697de85b74463f0a60ecc605';
//         return this.dbNodesService.approvalNode();
//       }

//       case NodeType.CONDITION: {
//         // Condition node - evaluates and sets routing decision
//         return (state: typeof stateSchema.State) => {
//           this.logger.debug(`🔀 Condition node: ${node.id}`);

//           const condition = {
//             field: (nodeData.field as string) || 'error',
//             operator: (nodeData.operator as string) || 'exists',
//             value: nodeData.value,
//           };

//           // Check retry limit to prevent infinite loops
//           const maxRetries = 15;
//           const currentAttempts = state.sqlAttempts || 0;

//           if (currentAttempts >= maxRetries) {
//             this.logger.warn(
//               `  ⚠️ Max retry limit (${maxRetries}) reached, forcing NO path`,
//             );
//             return {
//               conditionResult: false,
//               error: `Maximum retry attempts (${maxRetries}) exceeded`,
//             };
//           }

//           // Evaluate the condition
//           const result = this.evaluateCondition(state, condition);

//           this.logger.debug(
//             `  Condition result: ${result ? 'YES (true)' : 'NO (false)'}`,
//           );
//           this.logger.debug(
//             `  Checking: ${String(condition.field)} ${String(condition.operator)} ${JSON.stringify(condition.value) || ''}`,
//           );
//           this.logger.debug(`  Attempts: ${currentAttempts}/${maxRetries}`);

//           return {
//             // Store the result for routing
//             conditionResult: result,
//           };
//         };
//       }

//       case NodeType.INITIAL: {
//         return () => {
//           this.logger.debug('🚀 Initial node - workflow started');
//           return {};
//         };
//       }

//       case NodeType.LLM_NODE: {
//         return () => {
//           this.logger.debug('⚙️ LLM configured');
//           return {};
//         };
//       }

//       default: {
//         return () => {
//           this.logger.debug(`⚠️ Pass-through node: ${node.id}`);
//           return {};
//         };
//       }
//     }
//   }

//   /**
//    * ENHANCED: Dynamic edge creation with CONDITION node awareness
//    */
//   private addDynamicEdges(
//     graph: StateGraph<typeof stateSchema>,
//     workflow: WorkflowWithRelations,
//   ) {
//     const connectionsBySource = new Map<
//       string,
//       WorkflowWithRelations['connections']
//     >();

//     for (const conn of workflow.connections) {
//       if (!connectionsBySource.has(conn.fromNodeId)) {
//         connectionsBySource.set(conn.fromNodeId, []);
//       }
//       connectionsBySource.get(conn.fromNodeId)!.push(conn);
//     }

//     for (const [sourceNodeId, connections] of connectionsBySource.entries()) {
//       const sourceNode = workflow.nodes.find((n) => n.id === sourceNodeId);

//       // Check if source is a CONDITION node
//       if (sourceNode?.type === NodeType.CONDITION) {
//         this.logger.debug(`  Condition node routing: ${sourceNodeId}`);
//         this.addConditionNodeEdges(graph, sourceNodeId, connections);
//       } else {
//         // Regular node routing
//         const sortedConnections = [...connections].sort(
//           (a, b) => (a.priority || 0) - (b.priority || 0),
//         );

//         const hasConditions = sortedConnections.some((c) => {
//           const condition = c.condition as Record<string, unknown> | null;
//           return condition && Object.keys(condition).length > 0;
//         });

//         if (sortedConnections.length === 1 && !hasConditions) {
//           const conn = sortedConnections[0];
//           this.logger.debug(
//             `  Direct edge: ${conn.fromNodeId} → ${conn.toNodeId}`,
//           );
//           graph.addEdge(conn.fromNodeId as any, conn.toNodeId as any);
//         } else {
//           this.addConditionNodeEdges(graph, sourceNodeId, sortedConnections);
//         }
//       }
//     }
//   }

//   /**
//    * NEW: Handle CONDITION node routing
//    * Routes based on "yes" or "no" handles
//    */
//   private addConditionNodeEdges(
//     graph: StateGraph<typeof stateSchema>,
//     conditionNodeId: string,
//     connections: WorkflowWithRelations['connections'],
//   ) {
//     // Find yes and no connections
//     const yesConnection = connections.find((c) => c.fromOutput === 'yes');
//     const noConnection = connections.find((c) => c.fromOutput === 'no');

//     if (!yesConnection && !noConnection) {
//       this.logger.warn(
//         `  ⚠️ Condition node ${conditionNodeId} has no yes/no connections`,
//       );
//       return;
//     }

//     this.logger.debug(`  Condition routing setup:`);
//     this.logger.debug(`    YES → ${yesConnection?.toNodeId || 'not set'}`);
//     this.logger.debug(`    NO → ${noConnection?.toNodeId || 'END (default)'}`);

//     // Create routing function based on conditionResult
//     const routingFunction = (state: typeof stateSchema.State) => {
//       const result = state.conditionResult;

//       if (result === true) {
//         if (yesConnection) {
//           this.logger.debug(
//             `  ✅ Condition TRUE, routing to: ${yesConnection.toNodeId}`,
//           );
//           return yesConnection.toNodeId;
//         }
//         this.logger.warn(`  ⚠️ Condition TRUE but no YES connection, ending`);
//         return END;
//       } else {
//         // result === false or undefined
//         if (noConnection) {
//           this.logger.debug(
//             `  ❌ Condition FALSE, routing to: ${noConnection.toNodeId}`,
//           );
//           return noConnection.toNodeId;
//         }
//         this.logger.debug(
//           `  ❌ Condition FALSE, no NO connection, ending workflow`,
//         );
//         return END;
//       }
//     };

//     // Build target map
//     const targetMap: Record<string, string> = {};
//     if (yesConnection)
//       targetMap[yesConnection.toNodeId] = yesConnection.toNodeId;
//     if (noConnection) targetMap[noConnection.toNodeId] = noConnection.toNodeId;
//     targetMap[END] = END;

//     graph.addConditionalEdges(
//       conditionNodeId as any,
//       routingFunction,
//       targetMap as any,
//     );
//   }

//   /**
//    * ENHANCED: Condition evaluator
//    * Supports: exists, eq, ne, gt, lt, gte, lte, contains
//    */
//   private evaluateCondition(
//     state: typeof stateSchema.State,
//     condition: Record<string, unknown>,
//   ): boolean {
//     const { field, operator, value } = condition;

//     if (!field || !operator) {
//       this.logger.warn('⚠️ Invalid condition: missing field or operator');
//       return false;
//     }

//     // Get field value from state (supports dot notation)
//     const fieldValue = this.getNestedValue(state, field as string);

//     this.logger.debug(
//       `    Checking: ${JSON.stringify(field)} ${JSON.stringify(operator)} ${JSON.stringify(value)}, actual value: ${String(fieldValue)}`,
//     );

//     switch (operator as string) {
//       case 'exists':
//         return fieldValue !== undefined && fieldValue !== null;
//       case 'not_exists':
//         return fieldValue === undefined || fieldValue === null;
//       case 'eq':
//         return fieldValue === value;
//       case 'ne':
//         return fieldValue !== value;
//       case 'gt':
//         return (fieldValue as number) > (value as number);
//       case 'lt':
//         return (fieldValue as number) < (value as number);
//       case 'gte':
//         return (fieldValue as number) >= (value as number);
//       case 'lte':
//         return (fieldValue as number) <= (value as number);
//       case 'contains':
//         return String(fieldValue).includes(String(value));
//       case 'starts_with':
//         return String(fieldValue).startsWith(String(value));
//       case 'ends_with':
//         return String(fieldValue).endsWith(String(value));
//       default:
//         this.logger.warn(`⚠️ Unknown operator: ${JSON.stringify(operator)}`);
//         return false;
//     }
//   }

//   /**
//    * Get nested value from object using dot notation
//    */
//   private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
//     return path.split('.').reduce((current, key) => {
//       if (current && typeof current === 'object') {
//         return (current as Record<string, unknown>)[key];
//       }
//       return undefined;
//     }, obj as unknown);
//   }

//   clearCache(workflowId?: string) {
//     if (workflowId) {
//       this.logger.log(`🗑️ Clearing cache for workflow: ${workflowId}`);
//       this.graphCache.delete(workflowId);
//     } else {
//       this.logger.log('🗑️ Clearing entire graph cache');
//       this.graphCache.clear();
//     }
//     // this.llmService.LLM = null;
//   }

//   getCacheStats() {
//     return {
//       cachedGraphs: this.graphCache.size,
//       workflowIds: Array.from(this.graphCache.keys()),
//     };
//   }
// }
