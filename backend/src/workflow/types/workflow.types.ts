/**
 * Core workflow system types
 */

export enum WorkflowDomain {
  SQL = 'sql',
  TRADING = 'trading',
  DOCUMENT = 'document',
  AGENT = 'agent',
  LLM = 'llm',
  MIXED = 'mixed',
}

export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

export interface WorkflowNode {
  id: string;
  type: string; // e.g., 'sql.generator', 'trading.binance'
  position: {
    x: number;
    y: number;
  };
  config: Record<string, any>;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  condition?: string; // For conditional branching
}

export interface WorkflowDefinition {
  id?: string;
  name: string;
  description?: string;
  domain: WorkflowDomain;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  metadata?: {
    createdAt?: Date;
    updatedAt?: Date;
    author?: string;
    tags?: string[];
  };
}

export interface WorkflowExecutionInput {
  workflowId?: string;
  definition?: WorkflowDefinition;
  input: Record<string, any>;
}

export interface WorkflowExecutionResult {
  id: string;
  workflowId: string;
  status: WorkflowStatus;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface ExecutionContext {
  services: {
    llmService?: any;
    dbService?: any;
    [key: string]: any;
  };
  config: Record<string, any>;
  state: Record<string, any>;
}

export interface NodeSchema {
  input: any; // JSONSchema
  output: any; // JSONSchema
  config: any; // JSONSchema
}
