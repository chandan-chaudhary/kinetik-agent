import { registerAs } from '@nestjs/config';

export default registerAs('llm', () => ({
  groqModel: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
  groqModelProvider: process.env.GROQ_MODEL_PROVIDER || 'groq',
  groqApiKey: process.env.GROQ_API_KEY || '',

  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  ollamaModelProvider: process.env.OLLAMA_MODEL_PROVIDER || 'ollama',

  tavilyApiKey: process.env.TAVILY_API_KEY || '',
  databaseUrl: process.env.DATABASE_URL || '',
}));
