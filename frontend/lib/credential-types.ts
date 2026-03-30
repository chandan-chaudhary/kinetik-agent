export type FieldType = "string" | "password" | "number" | "boolean" | "select";

export interface CredentialField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  default?: unknown;
  placeholder?: string;
  options?: { label: string; value: string }[];
  hint?: string;
}

export interface CredentialTypeDefinition {
  type: string;
  label: string;
  icon?: string;
  fields: CredentialField[];
}

export const CREDENTIAL_DEFINITIONS: CredentialTypeDefinition[] = [
  {
    type: "LLM",
    label: "LLM / AI Model",
    fields: [
      {
        key: "provider",
        label: "Provider",
        type: "select",
        required: true,
        options: [
          { label: "Groq", value: "groq" },
          { label: "Google Gemini", value: "google-genai" },
          { label: "OpenAI", value: "openai" },
          { label: "Ollama (Local)", value: "ollama" },
        ],
      },
      {
        key: "model",
        label: "Model",
        type: "string",
        placeholder: "llama-3.3-70b-versatile",
      },
      {
        key: "apiKey",
        label: "API Key",
        type: "password",
        placeholder: "gsk_...",
      },
    ],
  },
  {
    type: "DATABASE",
    label: "Database",
    fields: [
      {
        key: "provider",
        label: "Database Type",
        type: "select",
        required: true,
        options: [
          { label: "PostgreSQL", value: "postgres" },
          { label: "MongoDB", value: "mongodb" },
          { label: "MySQL", value: "mysql" },
        ],
      },
      {
        key: "dbUrl",
        label: "Connection URL",
        type: "password",
        required: true,
        placeholder: "postgresql://user:pass@host:5432/db",
        hint: "Full connection string",
      },
      { key: "ssl", label: "Use SSL", type: "boolean", default: false },
    ],
  },
  {
    type: "API_KEY",
    label: "3rd Party API",
    fields: [
      {
        key: "provider",
        label: "Service Name",
        type: "string",
        required: true,
        placeholder: "Tavily, AlphaVantage, Stripe...",
      },
      { key: "apiKey", label: "API Key", type: "password", required: true },
      {
        key: "baseUrl",
        label: "Base URL (optional)",
        type: "string",
        placeholder: "https://api.example.com",
      },
    ],
  },
  {
    type: "TELEGRAM",
    label: "Telegram Bot",
    fields: [
      {
        key: "botToken",
        label: "Bot Token",
        type: "password",
        required: true,
        placeholder: "123456:ABC-...",
      },
      {
        key: "chatId",
        label: "Default Chat ID",
        type: "string",
        placeholder: "-1001234567890",
      },
    ],
  },
];

export function getCredentialDef(
  type: string,
): CredentialTypeDefinition | undefined {
  return CREDENTIAL_DEFINITIONS.find((d) => d.type === type);
}
