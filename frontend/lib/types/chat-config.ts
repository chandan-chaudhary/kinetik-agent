export enum DbType {
  POSTGRES = "postgres",
  MONGODB = "mongodb",
}

export enum LlmProvider {
  GROQ = "groq",
  GOOGLE = "google",
  GOOGLE_GENAI = "google-genai",
  OLLAMA = "ollama",
}

export const DB_TYPES = [DbType.POSTGRES, DbType.MONGODB] as const;
export const LLM_PROVIDERS = [
  LlmProvider.GROQ,
  LlmProvider.GOOGLE,
  LlmProvider.GOOGLE_GENAI,
  LlmProvider.OLLAMA,
] as const;

export const DEFAULT_DB_TYPE: DbType = DbType.POSTGRES;

export const DEFAULT_MODELS: Record<LlmProvider, string> = {
  [LlmProvider.GROQ]: "llama-3.3-70b-versatile",
  [LlmProvider.GOOGLE]: "gemini-1.5-flash",
  [LlmProvider.GOOGLE_GENAI]: "gemini-1.5-flash",
  [LlmProvider.OLLAMA]: "llama3.2",
};

export const DB_PLACEHOLDERS: Record<DbType, string> = {
  [DbType.POSTGRES]: "postgresql://user:password@localhost:5432/dbname",
  [DbType.MONGODB]: "mongodb://user:password@localhost:27017/dbname",
};

export function isDbType(value: unknown): value is DbType {
  return DB_TYPES.includes(value as DbType);
}

export function isLlmProvider(value: unknown): value is LlmProvider {
  return LLM_PROVIDERS.includes(value as LlmProvider);
}
