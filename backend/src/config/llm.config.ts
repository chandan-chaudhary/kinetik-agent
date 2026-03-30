import { registerAs } from '@nestjs/config';
import { LlmProvider } from '@/types/chat-config.types';

export default registerAs('llm', () => ({
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  groqModelProvider: process.env.GROQ_MODEL_PROVIDER || LlmProvider.GROQ,
  groqApiKey: process.env.GROQ_API_KEY || '',

  googleModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash-lite',
  googleModelProvider:
    process.env.GEMINI_MODEL_PROVIDER || LlmProvider.GOOGLE_GENAI,
  googleApiKey: process.env.GOOGLE_API_KEY || '',

  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  ollamaModelProvider: process.env.OLLAMA_MODEL_PROVIDER || LlmProvider.OLLAMA,

  tavilyApiKey: process.env.TAVILY_API_KEY || '',
  sqlDatabaseUrl: process.env.SQL_DATABASE_URL || '',
}));
