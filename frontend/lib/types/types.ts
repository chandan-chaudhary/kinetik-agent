export type Json = Record<string, unknown> | Array<unknown> | string | number | boolean | null;
export type DateTime = string;

export enum NodeType {
  INITIAL = "INITIAL",
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
  outputConnections: Connection[];
  inputConnections: Connection[];
  createdAt: DateTime;
  updatedAt: DateTime;
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
  createdAt: DateTime;
  updatedAt: DateTime;
}
