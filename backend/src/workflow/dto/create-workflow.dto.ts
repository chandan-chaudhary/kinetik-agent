import {
  WorkflowDomain,
  WorkflowEdge,
  WorkflowNode,
} from '@/workflow/types/workflow.types';

export class CreateWorkflowDto {}
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
