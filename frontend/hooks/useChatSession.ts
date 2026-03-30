import { API_BASE_URL } from "@/lib/utils";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
  llmCredentialId?: string | null;
  llmProvider?: string | null;
  llmModel?: string | null;
  llmApiKey?: string | null;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export type ChatSessionSummary = Omit<ChatSession, "messages" | "databaseUrl">;

const fetchSessions = async (): Promise<ChatSessionSummary[]> => {
  const res = await axios.get<ChatSessionSummary[]>(
    `${API_BASE_URL}chat-sessions`,
    {
      withCredentials: true,
    },
  );
  return res.data;
};

const fetchSession = async (id: string): Promise<ChatSession> => {
  const res = await axios.get<ChatSession>(
    `${API_BASE_URL}chat-sessions/${id}`,
    {
      withCredentials: true,
    },
  );
  return res.data;
};

const createSession = async (data: {
  title?: string;
  dbType?: string;
  databaseUrl?: string;
  llmCredentialId?: string;
  llmProvider?: string;
  llmModel?: string;
  llmApiKey?: string;
}): Promise<ChatSession> => {
  const res = await axios.post<ChatSession>(
    `${API_BASE_URL}chat-sessions`,
    data,
    {
      withCredentials: true,
    },
  );
  return res.data;
};

const updateSession = async ({
  id,
  data,
}: {
  id: string;
  data: Partial<
    Pick<
      ChatSession,
      | "title"
      | "dbType"
      | "databaseUrl"
      | "llmCredentialId"
      | "llmProvider"
      | "llmModel"
      | "llmApiKey"
      | "messages"
    >
  >;
}): Promise<ChatSession> => {
  const res = await axios.patch<ChatSession>(
    `${API_BASE_URL}chat-sessions/${id}`,
    data,
    { withCredentials: true },
  );
  return res.data;
};

const deleteSession = async (id: string): Promise<{ success: boolean }> => {
  const res = await axios.delete(`${API_BASE_URL}chat-sessions/${id}`, {
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
    `${API_BASE_URL}chat-sessions/${id}`,
    { title },
    { withCredentials: true },
  );
  return res.data;
};

export function useChatSessions() {
  return useQuery<ChatSessionSummary[], Error>({
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

export function useUpdateChatSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateSession,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ["chat-sessions"] });
      qc.invalidateQueries({ queryKey: ["chat-session", variables.id] });
    },
    onError: () => toast.error("Failed to update chat settings"),
  });
}
