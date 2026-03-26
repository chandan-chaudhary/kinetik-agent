import { API_BASE_URL } from "@/lib/utils";
import axios from "axios";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

const base = API_BASE_URL.endsWith("/") ? API_BASE_URL : `${API_BASE_URL}/`;

export interface DBChatConfig {
  dbType: "postgres" | "mongodb";
  databaseUrl: string;
  llmProvider?: "groq" | "google" | "google-genai" | "ollama";
  credentialId?: string;
  model?: string;
  apiKey?: string;
}

// export interface DBQueryPayload {
//   prompt: string;
//   databaseUrl: string;
//   dbType: string;
//   // llmProvider/apiKey used when no credentialId is provided; backend will pull provider/model/key from credential when credentialId is set.
//   llmProvider?: string;
//   credentialId?: string;
//   model?: string;
//   apiKey?: string;
// }
export interface DBQueryPayload {
  prompt: string;
  sessionId: string;          // NEW
  databaseUrl: string;
  dbType: string;
  llmProvider?: string;
  credentialId?: string;
  model?: string;
  apiKey?: string;
}

export interface DBQueryResponse {
  interrupted?: boolean;
  completed?: boolean;
  threadId?: string;
  content?:
    | string
    | {
        question: string;
        generatedSql?: string;
        queryResult?: string;
        userQuery?: string;
        sqlAttempts?: number;
      };
}

export interface DBApprovePayload {
  threadId: string;
  approved: boolean;
  feedback?: string;
}

export interface DBApproveResponse {
  completed?: boolean;
  content?: string;
}

const queryDB = async (payload: DBQueryPayload): Promise<DBQueryResponse> => {
  const res = await axios.post<DBQueryResponse>(
    `${base}chat-database/query-dbgraph`,
    payload,
    { withCredentials: true },
  );
  return res.data;
};

const approveDB = async (
  payload: DBApprovePayload,
): Promise<DBApproveResponse> => {
  const res = await axios.post<DBApproveResponse>(
    `${base}chat-database/approve`,
    payload,
    { withCredentials: true },
  );
  return res.data;
};

export function useQueryDB() {
  return useMutation({
    mutationFn: queryDB,
    onError: () => toast.error("Failed to query database"),
  });
}

export function useApproveDB() {
  return useMutation({
    mutationFn: approveDB,
    onError: () => toast.error("Failed to process approval"),
  });
}
