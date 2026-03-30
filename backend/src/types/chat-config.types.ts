export enum DbType {
  POSTGRES = 'postgres',
  MONGODB = 'mongodb',
}

export enum LlmProvider {
  GROQ = 'groq',
  GOOGLE = 'google',
  GOOGLE_GENAI = 'google-genai',
  OLLAMA = 'ollama',
}

export const DB_TYPES = [DbType.POSTGRES, DbType.MONGODB] as const;
export const LLM_PROVIDERS = [
  LlmProvider.GROQ,
  LlmProvider.GOOGLE,
  LlmProvider.GOOGLE_GENAI,
  LlmProvider.OLLAMA,
] as const;

export function isDbType(value: unknown): value is DbType {
  return DB_TYPES.includes(value as DbType);
}

export function isLlmProvider(value: unknown): value is LlmProvider {
  return LLM_PROVIDERS.includes(value as LlmProvider);
}
