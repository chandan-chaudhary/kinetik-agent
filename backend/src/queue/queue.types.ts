export interface WorkflowJobData {
  workflowId: string;
  userId: string;
  payload?: Record<string, unknown>;
}
