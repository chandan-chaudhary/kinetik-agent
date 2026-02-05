import { Test, TestingModule } from '@nestjs/testing';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';

describe('WorkflowController', () => {
  let controller: WorkflowController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WorkflowController],
      providers: [WorkflowService],
    }).compile();

    controller = module.get<WorkflowController>(WorkflowController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

// import { Inject, Injectable, Logger } from '@nestjs/common';
// import {
//   StateGraph,
//   START,
//   END,
//   MemorySaver,
//   Annotation,
// } from '@langchain/langgraph';
// import { BaseChatModel } from '@langchain/core/language_models/chat_models';
// import { ChatGroq } from '@langchain/groq';
// import { ChatOllama } from '@langchain/ollama';
// import { NodeType, Prisma, ConnectionType } from '@prisma/client';
// import llmConfig from '@/config/llm.config';
// import type { ConfigType } from '@nestjs/config';
// import { NodesService } from 'src/nodes/nodes.service';
// import { z } from 'zod';

// // Enhanced state schema with dynamic fields
// const createDynamicStateSchema = (workflowConfig?: any) => {
//   const baseSchema = {
//     // Core fields
//     messages: Annotation.Root({
//       value: (x?: any, y?: any) => (y ? [...(x || []), ...y] : x || []),
//       default: () => [],
//     }),

//     // User interaction
//     userQuery: Annotation<string>({
//       value: (x, y) => y ?? x ?? '',
//       default: () => '',
//     }),

//     // Database operations
//     dbSchema: Annotation<string>({
//       value: (x, y) => y ?? x ?? '',
//       default: () => '',
//     }),
//     generatedSql: Annotation<string>({
//       value: (x, y) => y ?? x ?? '',
//       default: () => '',
//     }),
//     queryResult: Annotation<any>({
//       value: (x, y) => y ?? x ?? {},
//       default: () => ({}),
//     }),

//     // Error handling
//     error: Annotation<string | null>({
//       value: (x, y) => y ?? x,
//       default: () => null,
//     }),
//     errorStack: Annotation<string | null>({
//       value: (x, y) => y ?? x,
//       default: () => null,
//     }),

//     // Control flow
//     sqlAttempts: Annotation<number>({
//       value: (x, y) => y ?? x ?? 0,
//       default: () => 0,
//     }),
//     approved: Annotation<boolean>({
//       value: (x, y) => y ?? x ?? false,
//       default: () => false,
//     }),
//     feedback: Annotation<string | null>({
//       value: (x, y) => y ?? x,
//       default: () => null,
//     }),

//     // Conditional routing
//     routingDecision: Annotation<string | null>({
//       value: (x, y) => y ?? x,
//       default: () => null,
//     }),

//     // Dynamic variables (workflow-specific)
//     variables: Annotation<Record<string, any>>({
//       value: (x, y) => ({ ...(x || {}), ...(y || {}) }),
//       default: () => ({}),
//     }),

//     // Node execution tracking
//     executedNodes: Annotation<string[]>({
//       value: (x, y) => (y ? [...(x || []), ...y] : x || []),
//       default: () => [],
//     }),

//     // Loop control
//     loopCounter: Annotation<Record<string, number>>({
//       value: (x, y) => ({ ...(x || {}), ...(y || {}) }),
//       default: () => ({}),
//     }),
//   };

//   // Add workflow-specific fields
//   if (workflowConfig?.customFields) {
//     Object.keys(workflowConfig.customFields).forEach((key) => {
//       baseSchema[key] = Annotation<any>({
//         value: (x, y) => y ?? x,
//         default: () => workflowConfig.customFields[key].default,
//       });
//     });
//   }

//   return Annotation.Root(baseSchema);
// };

// // Type for Workflow with included relations
// type WorkflowWithRelations = Prisma.WorkflowGetPayload<{
//   include: {
//     nodes: true;
//     connections: true;
//   };
// }>;

// // Type for the compiled graph and checkpointer
// type CompiledGraphResult = {
//   graph: any;
//   checkpointer: MemorySaver;
//   stateSchema: any;
// };

// @Injectable()
// export class EnhancedWorkflowExecutorService {
//   private readonly logger = new Logger(EnhancedWorkflowExecutorService.name);
//   private graphCache = new Map<string, CompiledGraphResult>();
//   private llmCache = new Map<string, BaseChatModel>();

//   constructor(
//     @Inject(llmConfig.KEY)
//     private readonly llmConfigService: ConfigType<typeof llmConfig>,
//     private nodesService: NodesService,
//   ) {}

//   /**
//    * Build a dynamic LangGraph from a workflow definition
//    * This is the core method that converts DB workflow to executable graph
//    */
//   buildGraph(workflow: WorkflowWithRelations): CompiledGraphResult {
//     this.logger.log(`🔨 Building graph for workflow: ${workflow.name}`);

//     // Check cache first
//     if (this.graphCache.has(workflow.id)) {
//       this.logger.log('♻️  Using cached graph');
//       return this.graphCache.get(workflow.id)!;
//     }

//     // Create dynamic state schema
//     const stateSchema = createDynamicStateSchema(workflow.config);
//     const checkpointer = new MemorySaver();
//     const graph = new StateGraph(stateSchema);

//     // Track nodes that need interruption (e.g., approval nodes)
//     const interruptNodes: string[] = [];

//     // Step 1: Add all nodes to the graph
//     this.logger.log(`📦 Adding ${workflow.nodes.length} nodes to graph`);
//     for (const node of workflow.nodes) {
//       this.logger.debug(`  Adding node: ${node.id} (${node.type})`);

//       // Skip INITIAL and END nodes - they're handled by LangGraph
//       if (node.type === NodeType.INITIAL || node.type === NodeType.END) {
//         continue;
//       }

//       const graphNode = this.createDynamicNode(node, workflow);
//       graph.addNode(node.id, graphNode);

//       // Track approval nodes for interruption
//       if (node.type === NodeType.APPROVAL || node.type === NodeType.INPUT_PROMPT) {
//         interruptNodes.push(node.id);
//       }
//     }

//     // Step 2: Find entry point
//     const entryNode = this.findEntryNode(workflow);
//     if (!entryNode) {
//       throw new Error('No entry node found. Please add a trigger node.');
//     }

//     // Add edge from START to entry node
//     this.logger.log(`🚀 Entry point: START → ${entryNode.id}`);
//     graph.addEdge(START, entryNode.id as any);

//     // Step 3: Add connections (edges) with conditional routing support
//     this.logger.log(`🔗 Adding ${workflow.connections.length} connections`);
//     this.addConnectionsToGraph(graph, workflow);

//     // Step 4: Compile the graph
//     const compiledGraph = graph.compile({
//       checkpointer: checkpointer,
//       interruptBefore: interruptNodes.length > 0 ? (interruptNodes as any[]) : undefined,
//     });

//     this.logger.log('✅ Graph compiled successfully');
//     this.logger.log(`   Nodes: ${workflow.nodes.length}`);
//     this.logger.log(`   Connections: ${workflow.connections.length}`);
//     this.logger.log(`   Interrupts: ${interruptNodes.join(', ') || 'none'}`);

//     // Cache the result
//     const result: CompiledGraphResult = {
//       graph: compiledGraph,
//       checkpointer,
//       stateSchema,
//     };
//     this.graphCache.set(workflow.id, result);

//     return result;
//   }

//   /**
//    * Create a dynamic node based on type and configuration
//    * This method routes to the appropriate node implementation
//    */
//   private createDynamicNode(
//     node: WorkflowWithRelations['nodes'][number],
//     workflow: WorkflowWithRelations,
//   ) {
//     const nodeConfig = node.config as any;

//     switch (node.type) {
//       // ========== TRIGGER NODES ==========
//       case NodeType.SQL_QUERY_TRIGGER:
//         return this.nodesService.getSchemaNode(
//           nodeConfig?.databaseUrl || process.env.SQL_DATABASE_URL,
//         );

//       // ========== LLM NODES ==========
//       case NodeType.LLM_NODE:
//         // This node just configures LLM, doesn't execute
//         return async (state: any) => {
//           this.logger.debug('⚙️ LLM configuration node');
//           return {};
//         };

//       case NodeType.SQL_GENERATOR_ACTION:
//         const sqlGenLLM = this.getLLMForNode(node, workflow);
//         return this.nodesService.getSQLGeneratorNode(sqlGenLLM);

//       case NodeType.SQL_EXECUTOR_ACTION:
//         const sqlExecLLM = this.getLLMForNode(node, workflow);
//         return this.nodesService.getSQLExecutorNode(sqlExecLLM);

//       // ========== CONTROL FLOW NODES ==========
//       case NodeType.CONDITION:
//         return this.createConditionNode(node);

//       case NodeType.SWITCH:
//         return this.createSwitchNode(node);

//       case NodeType.LOOP:
//         return this.createLoopNode(node);

//       case NodeType.PARALLEL:
//         return this.createParallelNode(node);

//       // ========== INTERACTION NODES ==========
//       case NodeType.APPROVAL:
//         return this.nodesService.approvalNode();

//       case NodeType.INPUT_PROMPT:
//         return this.createInputPromptNode(node);

//       // ========== ACTION NODES ==========
//       case NodeType.HTTP_REQUEST_ACTION:
//         return this.createHttpRequestNode(node);

//       case NodeType.TRANSFORM_ACTION:
//         return this.createTransformNode(node);

//       // ========== DEFAULT ==========
//       default:
//         this.logger.warn(`⚠️  Unknown node type: ${node.type}, creating pass-through`);
//         return async (state: any) => {
//           this.logger.debug(`⚠️  Pass-through node: ${node.id}`);
//           return {};
//         };
//     }
//   }

//   /**
//    * Add connections to graph with support for conditional edges
//    */
//   private addConnectionsToGraph(
//     graph: any,
//     workflow: WorkflowWithRelations,
//   ) {
//     // Group connections by source node
//     const connectionsBySource = new Map<string, typeof workflow.connections>();

//     for (const conn of workflow.connections) {
//       if (!connectionsBySource.has(conn.fromNodeId)) {
//         connectionsBySource.set(conn.fromNodeId, []);
//       }
//       connectionsBySource.get(conn.fromNodeId)!.push(conn);
//     }

//     // Add edges to graph
//     for (const [sourceNodeId, connections] of connectionsBySource.entries()) {
//       // Sort by priority (for conditional routing)
//       const sortedConnections = connections.sort((a, b) => a.priority - b.priority);

//       if (sortedConnections.length === 1 && sortedConnections[0].type === ConnectionType.DIRECT) {
//         // Simple direct edge
//         const conn = sortedConnections[0];
//         this.logger.debug(`  Direct edge: ${conn.fromNodeId} → ${conn.toNodeId}`);
//         graph.addEdge(conn.fromNodeId as any, conn.toNodeId as any);
//       } else {
//         // Conditional or multiple edges - need routing function
//         this.logger.debug(`  Conditional edges from: ${sourceNodeId}`);
//         this.addConditionalEdges(graph, sourceNodeId, sortedConnections);
//       }
//     }
//   }

//   /**
//    * Add conditional edges with routing logic
//    */
//   private addConditionalEdges(
//     graph: any,
//     sourceNodeId: string,
//     connections: WorkflowWithRelations['connections'],
//   ) {
//     // Create routing function
//     const routingFunction = (state: any) => {
//       // Evaluate each connection's condition in priority order
//       for (const conn of connections) {
//         if (conn.type === ConnectionType.DIRECT) {
//           return conn.toNodeId;
//         }

//         if (conn.type === ConnectionType.CONDITIONAL && conn.condition) {
//           const condition = conn.condition as {
//             field: string;
//             operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'exists';
//             value?: any;
//             logic?: 'AND' | 'OR';
//             conditions?: any[];
//           };

//           if (this.evaluateCondition(state, condition)) {
//             this.logger.debug(`  ✅ Condition met: routing to ${conn.toNodeId}`);
//             return conn.toNodeId;
//           }
//         }

//         if (conn.type === ConnectionType.DYNAMIC) {
//           // Use routing decision from state
//           if (state.routingDecision === conn.toNodeId) {
//             return conn.toNodeId;
//           }
//         }
//       }

//       // Default: route to first connection or END
//       const defaultConn = connections[0];
//       if (defaultConn) {
//         this.logger.debug(`  ⚠️ No condition met: routing to default ${defaultConn.toNodeId}`);
//         return defaultConn.toNodeId;
//       }

//       this.logger.warn(`  ❌ No valid route found from ${sourceNodeId}, ending workflow`);
//       return END;
//     };

//     // Build target map
//     const targetMap: Record<string, string> = {};
//     connections.forEach((conn) => {
//       targetMap[conn.toNodeId] = conn.toNodeId;
//     });
//     targetMap[END as any] = END;

//     graph.addConditionalEdges(sourceNodeId as any, routingFunction, targetMap);
//   }

//   /**
//    * Evaluate a condition against state
//    */
//   private evaluateCondition(state: any, condition: any): boolean {
//     const { field, operator, value, logic, conditions } = condition;

//     // Handle nested conditions (AND/OR logic)
//     if (conditions && Array.isArray(conditions)) {
//       const results = conditions.map((cond) => this.evaluateCondition(state, cond));
//       return logic === 'OR' ? results.some(Boolean) : results.every(Boolean);
//     }

//     // Get field value from state (supports nested paths like "user.email")
//     const fieldValue = this.getNestedValue(state, field);

//     // Evaluate operator
//     switch (operator) {
//       case 'eq':
//         return fieldValue === value;
//       case 'ne':
//         return fieldValue !== value;
//       case 'gt':
//         return fieldValue > value;
//       case 'lt':
//         return fieldValue < value;
//       case 'gte':
//         return fieldValue >= value;
//       case 'lte':
//         return fieldValue <= value;
//       case 'contains':
//         return String(fieldValue).includes(value);
//       case 'exists':
//         return fieldValue !== undefined && fieldValue !== null;
//       default:
//         this.logger.warn(`Unknown operator: ${operator}`);
//         return false;
//     }
//   }

//   /**
//    * Get nested value from object using dot notation
//    */
//   private getNestedValue(obj: any, path: string): any {
//     return path.split('.').reduce((current, key) => current?.[key], obj);
//   }

//   /**
//    * Find the entry node for the workflow
//    */
//   private findEntryNode(workflow: WorkflowWithRelations) {
//     return workflow.nodes.find(
//       (node) =>
//         node.type === NodeType.SQL_QUERY_TRIGGER ||
//         node.type === NodeType.HTTP_TRIGGER ||
//         node.type === NodeType.SCHEDULE_TRIGGER ||
//         node.type === NodeType.WEBHOOK_TRIGGER ||
//         node.type === NodeType.INITIAL,
//     );
//   }

//   /**
//    * Get LLM instance for a node (with caching)
//    */
//   private getLLMForNode(
//     node: WorkflowWithRelations['nodes'][number],
//     workflow: WorkflowWithRelations,
//   ): BaseChatModel {
//     const nodeConfig = node.config as any;

//     // Priority: Node config > Workflow config > Global config
//     const llmConfig = {
//       provider: nodeConfig?.llm?.provider || workflow.config?.llm?.provider || 'groq',
//       model: nodeConfig?.llm?.model || workflow.config?.llm?.model || this.llmConfigService.groqModel,
//       temperature: nodeConfig?.llm?.temperature ?? workflow.config?.llm?.temperature ?? 0.7,
//       maxTokens: nodeConfig?.llm?.maxTokens || workflow.config?.llm?.maxTokens || 4096,
//     };

//     // Create cache key
//     const cacheKey = `${llmConfig.provider}:${llmConfig.model}:${llmConfig.temperature}`;

//     // Return cached instance if exists
//     if (this.llmCache.has(cacheKey)) {
//       return this.llmCache.get(cacheKey)!;
//     }

//     // Create new LLM instance
//     let llm: BaseChatModel;

//     switch (llmConfig.provider) {
//       case 'groq':
//         llm = new ChatGroq({
//           model: llmConfig.model,
//           temperature: llmConfig.temperature,
//           maxTokens: llmConfig.maxTokens,
//         });
//         break;

//       case 'ollama':
//         llm = new ChatOllama({
//           model: llmConfig.model,
//           temperature: llmConfig.temperature,
//         });
//         break;

//       default:
//         this.logger.warn(`Unknown LLM provider: ${llmConfig.provider}, using Groq`);
//         llm = new ChatGroq({
//           model: this.llmConfigService.groqModel,
//           temperature: 0.7,
//         });
//     }

//     // Cache and return
//     this.llmCache.set(cacheKey, llm);
//     this.logger.debug(`🤖 Created LLM: ${cacheKey}`);
//     return llm;
//   }

//   // ========== CONTROL FLOW NODE IMPLEMENTATIONS ==========

//   private createConditionNode(node: any) {
//     return async (state: any) => {
//       this.logger.debug(`🔀 Condition node: ${node.id}`);
//       const config = node.config as any;

//       // Evaluate condition and set routing decision
//       const conditionMet = this.evaluateCondition(state, config.condition);

//       return {
//         routingDecision: conditionMet ? config.trueTarget : config.falseTarget,
//         executedNodes: [node.id],
//       };
//     };
//   }

//   private createSwitchNode(node: any) {
//     return async (state: any) => {
//       this.logger.debug(`🔀 Switch node: ${node.id}`);
//       const config = node.config as any;
//       const switchValue = this.getNestedValue(state, config.field);

//       // Find matching case
//       const matchingCase = config.cases?.find((c: any) => c.value === switchValue);
//       const target = matchingCase?.target || config.defaultTarget;

//       return {
//         routingDecision: target,
//         executedNodes: [node.id],
//       };
//     };
//   }

//   private createLoopNode(node: any) {
//     return async (state: any) => {
//       this.logger.debug(`🔁 Loop node: ${node.id}`);
//       const config = node.config as any;
//       const loopKey = node.id;

//       // Initialize or increment counter
//       const currentCount = (state.loopCounter?.[loopKey] || 0) + 1;
//       const maxIterations = config.maxIterations || 10;

//       // Check if should continue looping
//       const shouldContinue = currentCount < maxIterations;

//       return {
//         loopCounter: { ...state.loopCounter, [loopKey]: currentCount },
//         routingDecision: shouldContinue ? config.loopTarget : config.exitTarget,
//         executedNodes: [node.id],
//       };
//     };
//   }

//   private createParallelNode(node: any) {
//     return async (state: any) => {
//       this.logger.debug(`⚡ Parallel node: ${node.id}`);
//       // Parallel execution is handled by connection routing
//       // This node just passes through
//       return {
//         executedNodes: [node.id],
//       };
//     };
//   }

//   private createInputPromptNode(node: any) {
//     return async (state: any) => {
//       this.logger.debug(`📝 Input prompt node: ${node.id}`);
//       const config = node.config as any;

//       // This would trigger UI prompt in frontend
//       return {
//         executedNodes: [node.id],
//         variables: {
//           ...state.variables,
//           promptMessage: config.message,
//           promptField: config.field,
//         },
//       };
//     };
//   }

//   private createHttpRequestNode(node: any) {
//     return async (state: any) => {
//       this.logger.debug(`🌐 HTTP request node: ${node.id}`);
//       const config = node.config as any;

//       // TODO: Implement HTTP request logic
//       return {
//         executedNodes: [node.id],
//       };
//     };
//   }

//   private createTransformNode(node: any) {
//     return async (state: any) => {
//       this.logger.debug(`🔄 Transform node: ${node.id}`);
//       const config = node.config as any;

//       // TODO: Implement data transformation logic
//       return {
//         executedNodes: [node.id],
//       };
//     };
//   }

//   /**
//    * Clear the graph cache
//    */
//   clearCache(workflowId?: string) {
//     if (workflowId) {
//       this.logger.log(`🗑️ Clearing cache for workflow: ${workflowId}`);
//       this.graphCache.delete(workflowId);
//     } else {
//       this.logger.log('🗑️ Clearing entire graph cache');
//       this.graphCache.clear();
//       this.llmCache.clear();
//     }
//   }

//   /**
//    * Get cache statistics
//    */
//   getCacheStats() {
//     return {
//       cachedGraphs: this.graphCache.size,
//       cachedLLMs: this.llmCache.size,
//       workflowIds: Array.from(this.graphCache.keys()),
//     };
//   }
// }

// ******************************************************************OWN CRAETE !ST APPROACH************************************************

// import { Inject, Injectable } from '@nestjs/common';
// import { StateGraph, START, MemorySaver } from '@langchain/langgraph';
// import { stateSchema } from 'src/config/schemas'; //StateType
// import { NodesService } from 'src/nodes/nodes.service';
// import { NodeType, Prisma } from '@prisma/client';
// import llmConfig from '@/config/llm.config';
// import { LlmService } from '@/llm/llm.service';

// // Type for Workflow with included relations
// type WorkflowWithRelations = Prisma.WorkflowGetPayload<{
//   include: {
//     nodes: true;
//     connections: true;
//   };
// }>;

// // Type for the compiled graph and checkpointer
// type CompiledGraphResult = {
//   graph: ReturnType<StateGraph<typeof stateSchema>['compile']>;
//   checkpointer: MemorySaver;
// };

// @Injectable()
// export class WorkflowExecutorService {
//   private graphCache = new Map<string, CompiledGraphResult>();

//   constructor(
//     @Inject(llmConfig.KEY)
//     private nodesService: NodesService,
//     private readonly LlmService: LlmService,
//   ) {}

//   /**
//    * Build a dynamic LangGraph from a workflow definition
//    * @param workflow - The workflow definition from the database
//    * @returns Compiled LangGraph ready for execution
//    */
//   buildGraph(workflow: WorkflowWithRelations): CompiledGraphResult {
//     console.log(`🔨 Building graph for workflow: ${workflow.name}`);

//     // Check cache first
//     if (this.graphCache.has(workflow.id)) {
//       console.log('♻️  Using cached graph');
//       return this.graphCache.get(workflow.id)!;
//     }

//     const checkpointer = new MemorySaver();
//     const graph = new StateGraph(stateSchema);

//     // Track which nodes need interruption
//     const interruptNodes: string[] = [];

//     // First, find and configure LLM node if present
//     // const llmNode = workflow.nodes.find(
//     //   (node) => node.type === NodeType.LLM_NODE,
//     // );
//     // if (llmNode) {
//     //   this.configureLLM(llmNode);
//     // }

//     // Add all nodes to the graph
//     for (const node of workflow.nodes) {
//       console.log(`  Adding node: ${node.id} (${node.type})`);

//       const graphNode = this.createNode(node);
//       graph.addNode(node.id, graphNode);

//       // Track approval nodes for interruption
//       if (node.type === 'APPROVAL') {
//         interruptNodes.push(node.id);
//       }
//     }

//     // Find the trigger node (entry point)
//     const triggerNode = workflow.nodes.find(
//       (node) =>
//         node.type === NodeType.SQL_QUERY_TRIGGER ||
//         node.type === NodeType.INITIAL,
//     );

//     if (!triggerNode) {
//       throw new Error(
//         'No trigger node found. Please add a trigger node to start the workflow.',
//       );
//     }

//     // Add edge from START to trigger node
//     console.log(`Adding edge: START → ${triggerNode.id}`);
//     graph.addEdge(START, triggerNode.id as any);

//     // Add all other edges from connections
//     for (const edge of workflow.connections) {
//       console.log(`Adding edge: ${edge.fromNodeId} → ${edge.toNodeId}`);
//       graph.addEdge(edge.fromNodeId as any, edge.toNodeId as any);
//     }

//     // Compile the graph
//     const compiledGraph = graph.compile({
//       checkpointer: checkpointer,
//       // interruptBefore:
//       //   interruptNodes.length > 0 ? (interruptNodes as any[]) : undefined,
//     });

//     console.log('✅ Graph compiled successfully');
//     console.log(`   Nodes: ${workflow.nodes.length}`);
//     console.log(`   Edges: ${workflow.connections.length}`);
//     console.log(`   Interrupts: ${interruptNodes.join(', ') || 'none'}`);

//     // Cache the graph
//     const result: CompiledGraphResult = {
//       graph: compiledGraph,
//       checkpointer,
//     };
//     this.graphCache.set(workflow.id, result);

//     return result;
//   }

//   /**
//    * Create a LangGraph node based on node type and configuration
//    * @param node - Node definition from workflow
//    * @returns LangGraph node function
//    */
//   private createNode(node: WorkflowWithRelations['nodes'][number]) {
//     switch (node.type) {
//       case NodeType.SQL_QUERY_TRIGGER:
//         // Database schema fetcher node
//         return this.nodesService.getSchemaNode(
//           (node?.data as { databaseUrl?: string })?.databaseUrl as string,
//         );

//       case NodeType.SQL_GENERATOR_ACTION: {
//         // SQL generation node with LLM
//         if (!this.LlmService) {
//           throw new Error(
//             'LLM not configured. Please add an LLM_NODE to your workflow.',
//           );
//         }
//         return this.nodesService.getSQLGeneratorNode(this.LlmService.LLM);
//       }

//       case NodeType.SQL_EXECUTOR_ACTION: {
//         // SQL execution node
//         if (!this.LlmService) {
//           throw new Error(
//             'LLM not configured. Please add an LLM_NODE to your workflow.',
//           );
//         }
//         return this.nodesService.getSQLExecutorNode(this.LlmService.LLM);
//       }

//       case NodeType.APPROVAL:
//         // Human-in-the-loop approval node
//         return this.nodesService.approvalNode();

//       // case NodeType.SHOULD_CONTINUE:
//       // case 'shouldContinue':
//       //   // Conditional routing node
//       //   // This is handled via conditional edges, not as a regular node
//       //   throw new Error(
//       //     'shouldContinue is not a node type - use conditional edges instead',
//       //   );

//       case NodeType.INITIAL:
//         // Initial/trigger node - doesn't do anything, just starts the flow
//         return () => {
//           console.log('🚀 Initial node - workflow started');
//           return {}; // Pass through state unchanged
//         };

//       case NodeType.LLM_NODE:
//         // LLM configuration node - doesn't execute, just configures
//         return () => {
//           console.log('⚙️  LLM configured');
//           return {}; // Pass through state unchanged
//         };

//       default:
//         console.warn(
//           `⚠️  Unknown node type: ${node.type as string}, creating pass-through node`,
//         );
//         return () => {
//           console.log(`⚠️  Pass-through node: ${node.id}`);
//           return {}; // Pass through state unchanged
//         };
//     }
//   }

//   /**
//    * Clear the graph cache (useful when workflow is updated)
//    * @param workflowId - Optional workflow ID to clear specific cache
//    */
//   clearCache(workflowId?: string) {
//     if (workflowId) {
//       console.log(`🗑️  Clearing cache for workflow: ${workflowId}`);
//       this.graphCache.delete(workflowId);
//     } else {
//       console.log('🗑️  Clearing entire graph cache');
//       this.graphCache.clear();
//     }
//     // Reset LLM instance when clearing cache
//   }

//   /**
//    * Get cache statistics
//    */
//   getCacheStats() {
//     return {
//       cachedGraphs: this.graphCache.size,
//       workflowIds: Array.from(this.graphCache.keys()),
//     };
//   }
// }
