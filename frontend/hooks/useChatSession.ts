import { API_BASE_URL } from "@/lib/utils";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  sql?: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  title: string;
  threadId: string;
  dbType: string;
  databaseUrl?: string | null;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const fetchSessions = async (): Promise<ChatSession[]> => {
  const res = await axios.get<ChatSession[]>(`${base}chat-sessions`, {
    withCredentials: true,
  });
  return res.data;
};

const fetchSession = async (id: string): Promise<ChatSession> => {
  const res = await axios.get<ChatSession>(`${base}chat-sessions/${id}`, {
    withCredentials: true,
  });
  return res.data;
};

const createSession = async (data: {
  title?: string;
  dbType?: string;
  databaseUrl?: string;
}): Promise<ChatSession> => {
  const res = await axios.post<ChatSession>(`${base}chat-sessions`, data, {
    withCredentials: true,
  });
  return res.data;
};

const deleteSession = async (id: string): Promise<{ success: boolean }> => {
  const res = await axios.delete(`${base}chat-sessions/${id}`, {
    withCredentials: true,
  });
  return res.data;
};

const renameSession = async ({
  id,
  title,
}: {
  id: string;
  title: string;
}): Promise<ChatSession> => {
  const res = await axios.patch<ChatSession>(
    `${base}chat-sessions/${id}`,
    { title },
    { withCredentials: true },
  );
  return res.data;
};

export function useChatSessions() {
  return useQuery<ChatSession[], Error>({
    queryKey: ["chat-sessions"],
    queryFn: fetchSessions,
  });
}

export function useChatSession(id?: string) {
  return useQuery<ChatSession, Error>({
    queryKey: ["chat-session", id],
    queryFn: () => fetchSession(id!),
    enabled: !!id,
  });
}

export function useCreateChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-sessions"] }),
    onError: () => toast.error("Failed to create chat session"),
  });
}

export function useDeleteChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteSession,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chat-sessions"] });
      toast.success("Chat deleted");
    },
    onError: () => toast.error("Failed to delete chat"),
  });
}

export function useRenameChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: renameSession,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chat-sessions"] }),
    onError: () => toast.error("Failed to rename chat"),
  });
}