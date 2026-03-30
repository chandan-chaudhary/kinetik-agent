import { API_BASE_URL } from "@/lib/utils";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;

export type CredentialType = "LLM" | "DATABASE" | "API_KEY" | "TELEGRAM";

export interface Credential {
  id: string;
  name: string;
  type: CredentialType;
  data: string; // encrypted blob
  preview?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCredentialPayload {
  name: string;
  type: CredentialType;
  data: Record<string, unknown>;
  isActive?: boolean;
}

export interface UpdateCredentialPayload {
  id: string;
  data: Partial<CreateCredentialPayload>;
}

const fetchCredentials = async (
  type?: CredentialType,
): Promise<Credential[]> => {
  const query = type ? `?type=${encodeURIComponent(type)}` : "";
  const response = await axios.get<Credential[]>(`${base}credentials${query}`, {
    withCredentials: true,
  });
  return response.data;
};

const createCredential = async (
  payload: CreateCredentialPayload,
): Promise<Credential> => {
  const response = await axios.post<Credential>(`${base}credentials`, payload, {
    withCredentials: true,
  });
  return response.data;
};

const updateCredential = async ({
  id,
  data,
}: UpdateCredentialPayload): Promise<Credential> => {
  const response = await axios.patch<Credential>(
    `${base}credentials/${id}`,
    data,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

const deleteCredential = async (id: string): Promise<{ success: boolean }> => {
  const response = await axios.delete<{ success: boolean }>(
    `${base}credentials/${id}`,
    {
      withCredentials: true,
    },
  );
  return response.data;
};

export function useCredentials(type?: CredentialType) {
  return useQuery<Credential[], Error>({
    queryKey: ["credentials", type ?? "all"],
    queryFn: () => fetchCredentials(type),
  });
}

export function useCreateCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credential created");
    },
    onError: () => {
      toast.error("Failed to create credential");
    },
  });
}

export function useUpdateCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credential updated");
    },
    onError: () => {
      toast.error("Failed to update credential");
    },
  });
}

export function useDeleteCredential() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCredential,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      toast.success("Credential deleted");
    },
    onError: () => {
      toast.error("Failed to delete credential");
    },
  });
}
