import { API_BASE_URL } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
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
