export interface WorkflowJobData {
  workflowId: string;
  userId: string;
  payload?: Record<string, unknown>;
}

export interface TestJobData {
  message: string;
  [key: string]: any; // Allow additional properties for flexibility
}
