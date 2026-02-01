export type Json =
  | Record<string, unknown>
  | Array<unknown>
  | string
  | number
  | boolean
  | null;
export type DateTime = string;

export enum NodeType {
  INITIAL = "INITIAL",
  SQL_QUERY_TRIGGER = "SQL_QUERY_TRIGGER",
  JOB_BOT_TRIGGER = "JOB_BOT_TRIGGER",
  LLM_TRIGGER = "LLM_TRIGGER",
  TRADING_PRICE_TRIGGER = "TRADING_PRICE_TRIGGER",
  TRADING_TIME_TRIGGER = "TRADING_TIME_TRIGGER",

  //action nodes
  // SQL_QUERY_ACTION = "SQL_QUERY_ACTION",
  SQL_GENERATOR_ACTION = "SQL_GENERATOR_ACTION",
  SQL_EXECUTOR_ACTION = "SQL_EXECUTOR_ACTION",
}

export interface User {
  id: string;
  [key: string]: unknown;
}

export interface Workflow {
  id?: string;
  userId: string;
  user?: User;
  name: string;
  description?: string | null;
  nodes?: Node[];
  connections?: Connection[];
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export interface Node {
  id?: string;
  workflowId: string;
  workflow?: Workflow;
  type: NodeType;
  position: Json;
  data: Json;
  outputConnections?: Connection[];
  inputConnections?: Connection[];
  createdAt?: DateTime;
  updatedAt?: DateTime;
}

export interface Connection {
  id?: string;
  workflowId: string;
  workflow?: Workflow;
  fromNodeId: string;
  fromNode?: Node;
  toNodeId: string;
  toNode?: Node;
  fromOutput?: string;
  toInput?: string;
  createdAt?: DateTime;
  updatedAt?: DateTime;
}
