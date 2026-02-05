import { API_BASE_URL } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Workflow } from "@/lib/types/types";

const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;

const fetchWorkflows = async (): Promise<Workflow[]> => {
  const res = await axios.get<Workflow[]>(`${base}workflow`);
  return res.data;
};

const fetchWorkflow = async (id: string): Promise<Workflow> => {
  console.log("fetching by id ");

  const res = await axios.get(`${base}workflow/${id}`);
  return res.data;
};

const postWorkflow = async (data: Partial<Workflow>) => {
  const res = await axios.post<Workflow>(`${base}workflow`, data);
  return res.data;
};

const patchWorkflow = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<Workflow>;
}) => {
  const res = await axios.patch<Workflow>(`${base}workflow/${id}`, data);
  return res.data;
};

const removeWorkflow = async (id: string) => {
  const res = await axios.delete<{ success: boolean }>(`${base}workflow/${id}`);
  return res.data;
};

interface ExecuteWorkflowResponse {
  interrupted?: boolean;
  completed?: boolean;
  threadId?: string;
  content?: string | {
    question: string;
    response: string;
  };
  state?: {
    generatedSql?: string;
    queryResult?: Record<string, unknown>[];
    userQuery?: string;
  };
}

const executeWorkflow = async ({
  workflowId,
  prompt,
}: {
  workflowId: string;
  prompt: string;
}): Promise<ExecuteWorkflowResponse> => {
  const res = await axios.post<ExecuteWorkflowResponse>(
    `${base}workflow/${workflowId}/execute`,
    { prompt },
  );
  return res.data;
};

interface ApproveWorkflowPayload {
  threadId: string;
  workflowId: string;
  approved: boolean;
  feedback?: string;
}

interface ApproveWorkflowResponse {
  completed?: boolean;
  content?: string;
  interrupted?: boolean;
  state?: {
    generatedSql?: string;
    queryResult?: Record<string, unknown>[];
    userQuery?: string;
  };
}

const approveWorkflow = async ({
  threadId,
  workflowId,
  approved,
  feedback,
}: ApproveWorkflowPayload): Promise<ApproveWorkflowResponse> => {
  const res = await axios.post<ApproveWorkflowResponse>(
    `${base}workflow/execution/${threadId}/approve`,
    {
      workflowId,
      approved,
      feedback,
    },
  );
  return res.data;
};

export function useWorkflows() {
  return useQuery<Workflow[], Error>({
    queryKey: ["workflows"],
    queryFn: fetchWorkflows,
  });
}

export function useWorkflowById(id?: string) {
  return useQuery<Workflow, Error>({
    queryKey: ["workflow", id],
    queryFn: () => fetchWorkflow(id as string),
    enabled: !!id,
  });
}

export function useCreateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Workflow>) => postWorkflow(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow created");
    },
    onError: () => toast.error("Failed to create workflow"),
  });
}

export function useUpdateWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Workflow> }) =>
      patchWorkflow({ id, data }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      if (data?.id) qc.invalidateQueries({ queryKey: ["workflow", data.id] });
      toast.success("Workflow updated");
    },
    onError: () => toast.error("Failed to update workflow"),
  });
}

export function useDeleteWorkflow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => removeWorkflow(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflows"] });
      toast.success("Workflow deleted");
    },
    onError: () => toast.error("Failed to delete workflow"),
  });
}

export function useExecuteWorkflow() {
  return useMutation({
    mutationFn: executeWorkflow,
    onError: (error) => {
      console.error("Error executing workflow:", error);
      toast.error("Failed to execute workflow");
    },
  });
}

export function useApproveWorkflow() {
  return useMutation({
    mutationFn: approveWorkflow,
    onError: (error) => {
      console.error("Error approving workflow:", error);
      toast.error("Failed to process approval");
    },
  });
}
