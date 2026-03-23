"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import EntityHeader from "@/components/entity-header";
import {
  Loader2,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Bot,
  Database,
  Settings,
  Code,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryDB, useApproveDB, type DBChatConfig } from "@/hooks/useChatDB";
import { useCredentials } from "@/hooks/useCredentials";
import { Separator } from "@/components/ui/separator";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  sql?: string;
}

interface ApprovalContext {
  threadId: string;
  content: {
    question: string;
    generatedSql?: string;
    queryResult?: string;
    userQuery?: string;
    sqlAttempts?: number;
  };
}

const DEFAULT_MODELS: Record<string, string> = {
  groq: "llama-3.3-70b-versatile",
  google: "gemini-1.5-flash",
  "google-genai": "gemini-1.5-flash",
  ollama: "llama3.2",
};

const LLM_PROVIDERS = ["groq", "google", "google-genai", "ollama"] as const;

const DB_PLACEHOLDERS: Record<string, string> = {
  postgres: "postgresql://user:password@localhost:5432/dbname",
  mongodb: "mongodb://user:password@localhost:27017/dbname",
};

export default function ChatDBPage() {
  const [config, setConfig] = useState<DBChatConfig>({
    dbType: "postgres",
    databaseUrl: "",
    llmProvider: undefined,
    model: "",
    apiKey: "",
  });
  const [showApiKey, setShowApiKey] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [approvalContext, setApprovalContext] =
    useState<ApprovalContext | null>(null);
  const [feedback, setFeedback] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: llmCredentials, isLoading: llmCredsLoading } =
    useCredentials("LLM");
  const selectedCredential = llmCredentials?.find(
    (cred) => cred.id === config.credentialId,
  );

  const queryMutation = useQueryDB();
  const approveMutation = useApproveDB();
  const loading = queryMutation.isPending || approveMutation.isPending;

  const hasLlm = Boolean(config.credentialId || config.llmProvider);
  const readyToSave = config.databaseUrl.trim().length > 0 && hasLlm;
  const isConfigured = settingsSaved && readyToSave;
  const canChat = isConfigured && !loading && !settingsOpen;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, approvalContext]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  const handleProviderChange = (provider: DBChatConfig["llmProvider"]) => {
    setSettingsSaved(false);
    setConfig((prev) => ({
      ...prev,
      llmProvider: provider,
      model: DEFAULT_MODELS[provider],
      credentialId: undefined,
      apiKey: "",
    }));
  };

  const handleCredentialSelect = (credentialId?: string) => {
    setSettingsSaved(false);
    setConfig((prev) => {
      if (!credentialId) {
        return {
          ...prev,
          credentialId: undefined,
          llmProvider: undefined,
          model: "",
          apiKey: "",
        };
      }

      const cred = llmCredentials?.find((c) => c.id === credentialId);
      if (!cred) return prev;

      const provider = LLM_PROVIDERS.includes(
        cred.provider as (typeof LLM_PROVIDERS)[number],
      )
        ? (cred.provider as DBChatConfig["llmProvider"])
        : prev.llmProvider;

      const model = cred.model ?? DEFAULT_MODELS[provider] ?? prev.model;

      return {
        ...prev,
        credentialId,
        llmProvider: provider,
        model,
        apiKey: "",
      };
    });
  };

  const sendMessage = () => {
    if (!prompt.trim() || !isConfigured || !canChat) return;

    const userMessage: Message = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt("");

    const payload = config.credentialId
      ? {
          prompt: currentPrompt,
          databaseUrl: config.databaseUrl,
          dbType: config.dbType,
          credentialId: config.credentialId,
        }
      : {
          prompt: currentPrompt,
          databaseUrl: config.databaseUrl,
          dbType: config.dbType,
          llmProvider: config.llmProvider,
          model: config.model,
          apiKey: config.apiKey,
        };

    queryMutation.mutate(payload, {
      onSuccess: (data) => {
        if (data.interrupted) {
          const ctx =
            typeof data.content === "object" && data.content !== null
              ? data.content
              : { question: "Approval required" };

          const preview =
            typeof data.content === "object" && data.content !== null
              ? data.content.generatedSql || data.content.question
              : String(data.content ?? "Approval required");

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: preview,
              sql:
                typeof data.content === "object"
                  ? data.content.generatedSql
                  : undefined,
            },
          ]);

          setApprovalContext({
            threadId: data.threadId!,
            content: ctx as ApprovalContext["content"],
          });
        } else if (data.completed) {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content:
                typeof data.content === "string"
                  ? data.content
                  : JSON.stringify(data.content, null, 2),
            },
          ]);
        }
      },
      onError: () => {
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: "Failed to query database. Please try again.",
          },
        ]);
      },
    });
  };

  const handleApprove = (approved: boolean) => {
    if (!approvalContext) return;

    approveMutation.mutate(
      {
        threadId: approvalContext.threadId,
        approved,
        feedback: approved ? undefined : feedback || "Please regenerate",
      },
      {
        onSuccess: (data) => {
          if (data.completed) {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: data.content ?? "" },
            ]);
          }
          setApprovalContext(null);
          setFeedback("");
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            {
              role: "system",
              content: "Failed to process approval. Please try again.",
            },
          ]);
        },
      },
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/20 w-full">
      <EntityHeader
        title="Ask Database"
        description="Query your data with natural language"
      >
        <div className="hidden sm:flex items-center gap-2 mr-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${isConfigured ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground"}`}
          >
            <Database className="h-3 w-3" />
            {isConfigured ? config.dbType : "No DB"}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
            <Bot className="h-3 w-3" />
            {config.llmProvider ?? "No LLM"} / {config.model || "—"}
          </span>
        </div>

        <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Configure
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto ">
            <SheetHeader>
              <SheetTitle>Connection Settings</SheetTitle>
              <SheetDescription>
                Configure your database and AI model settings.
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6 px-2">
              {/* Database Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Database className="h-4 w-4 text-blue-500" />
                  Database
                </div>
                <Separator />

                <div className="space-y-2">
                  <Label>Database Type</Label>
                  <Select
                    value={config.dbType}
                    onValueChange={(v) => {
                      setSettingsSaved(false);
                      setConfig((prev) => ({
                        ...prev,
                        dbType: v as DBChatConfig["dbType"],
                        databaseUrl: "",
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="postgres">
                        <div className="flex items-center gap-2">
                          <span>🐘</span> PostgreSQL
                        </div>
                      </SelectItem>
                      <SelectItem value="mongodb">
                        <div className="flex items-center gap-2">
                          <span>🍃</span> MongoDB
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Connection String</Label>
                  <Textarea
                    value={config.databaseUrl}
                    onChange={(e) => {
                      setSettingsSaved(false);
                      setConfig((prev) => ({
                        ...prev,
                        databaseUrl: e.target.value,
                      }));
                    }}
                    placeholder={DB_PLACEHOLDERS[config.dbType]}
                    className="font-mono text-xs min-h-[80px] resize-none"
                  />
                </div>
              </div>

              {/* LLM Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Bot className="h-4 w-4 text-primary" />
                  AI Model
                </div>
                <Separator />

                <div className="space-y-2">
                  <Label>Credential</Label>
                  <Select
                    value={config.credentialId ?? "none"}
                    onValueChange={(v) =>
                      handleCredentialSelect(v === "none" ? undefined : v)
                    }
                    disabled={llmCredsLoading}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          llmCredsLoading
                            ? "Loading credentials..."
                            : "Select saved credential"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        <div className="flex flex-col text-left">
                          <span className="font-medium">Use custom key</span>
                          <span className="text-xs text-muted-foreground">
                            Manually set provider &amp; API key
                          </span>
                        </div>
                      </SelectItem>
                      {llmCredentials?.length === 0 && (
                        <SelectItem value="__empty" disabled>
                          No LLM credentials found
                        </SelectItem>
                      )}
                      {llmCredentials?.map((cred) => (
                        <SelectItem key={cred.id} value={cred.id}>
                          <div className="flex flex-col text-left">
                            <span className="font-medium">{cred.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {cred.provider}
                              {cred.model ? ` • ${cred.model}` : ""}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Selecting a credential keeps keys server-side; only the ID
                    is sent.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Provider</Label>
                  <Select
                    value={config.llmProvider}
                    onValueChange={(v) =>
                      handleProviderChange(v as DBChatConfig["llmProvider"])
                    }
                    disabled={!!config.credentialId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="groq">
                        <div className="flex items-center gap-2">
                          <span>⚡</span> Groq
                        </div>
                      </SelectItem>
                      <SelectItem value="google">
                        <div className="flex items-center gap-2">
                          <span>🌐</span> Google Gemini
                        </div>
                      </SelectItem>
                      <SelectItem value="ollama">
                        <div className="flex items-center gap-2">
                          <span>🦙</span> Ollama (Local)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Model Name</Label>
                  <Input
                    value={config.model}
                    onChange={(e) => {
                      setSettingsSaved(false);
                      setConfig((prev) => ({
                        ...prev,
                        model: e.target.value,
                      }));
                    }}
                    placeholder={
                      config.llmProvider
                        ? DEFAULT_MODELS[config.llmProvider]
                        : "Select provider first"
                    }
                    className="font-mono text-xs"
                    disabled={!!config.credentialId || !config.llmProvider}
                  />
                  <p className="text-xs text-muted-foreground">
                    {config.credentialId
                      ? "Model is set by the selected credential."
                      : !config.llmProvider
                        ? "Select a provider to set model"
                        : config.llmProvider === "groq"
                          ? "e.g. llama-3.3-70b-versatile, mixtral-8x7b-32768"
                          : config.llmProvider === "google"
                            ? "e.g. gemini-1.5-flash, gemini-1.5-pro"
                            : "e.g. llama3.2, mistral, codellama"}
                  </p>
                </div>

                {config.credentialId && (
                  <p className="text-xs text-muted-foreground">
                    Using stored provider/model/key from credential
                    {selectedCredential
                      ? ` "${selectedCredential.name}".`
                      : "."}
                  </p>
                )}

                {!config.credentialId &&
                  config.llmProvider &&
                  config.llmProvider !== "ollama" && (
                    <div className="space-y-2">
                      <Label>API Key</Label>
                      <div className="relative">
                        <Input
                          type={showApiKey ? "text" : "password"}
                          value={config.apiKey}
                          onChange={(e) => {
                            setSettingsSaved(false);
                            setConfig((prev) => ({
                              ...prev,
                              apiKey: e.target.value,
                            }));
                          }}
                          placeholder={
                            config.llmProvider === "groq"
                              ? "gsk_..."
                              : "AIza..."
                          }
                          className="pr-10 font-mono text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Leave empty to use the server&apos;s default key
                      </p>
                    </div>
                  )}
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  setSettingsSaved(true);
                  setSettingsOpen(false);
                }}
                disabled={!readyToSave}
              >
                {isConfigured ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Save &amp; Start Chatting
                  </>
                ) : (
                  "Add connection string to continue"
                )}
              </Button>
            </div>
          </SheetContent>
        </Sheet>
       
      </EntityHeader>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome / Not configured */}
          {messages.length === 0 && !approvalContext && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-blue-500/20 rounded-full" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600/60 flex items-center justify-center shadow-lg">
                  <Database className="h-10 w-10 text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Talk to your Database</h2>
                <p className="text-muted-foreground max-w-md">
                  Ask questions in plain English and get instant SQL-powered
                  answers.
                </p>
              </div>

              {!canChat ? (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-sm text-yellow-600 dark:text-yellow-400 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Configure your database and LLM to get started
                  </p>
                  <Button
                    onClick={() => setSettingsOpen(true)}
                    className="gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Open Settings
                  </Button>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                  {[
                    "Show me all tables",
                    "Count total records in each table",
                    "Show me the most recent 10 entries",
                    "What columns does the users table have?",
                  ].map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => setPrompt(suggestion)}
                      className="text-xs"
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-500",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {msg.role !== "user" && (
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-1">
                  {msg.role === "assistant" ? (
                    <Bot className="h-4 w-4 text-blue-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
              )}

              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[85%] shadow-sm space-y-2",
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-tr-sm"
                    : msg.role === "system"
                      ? "bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 text-yellow-900 dark:text-yellow-100"
                      : "bg-muted rounded-tl-sm",
                )}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                {msg.sql && (
                  <div className="bg-background/60 rounded-lg p-3 border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                      <Code className="h-3 w-3" />
                      Generated SQL
                    </div>
                    <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                      {msg.sql}
                    </pre>
                  </div>
                )}
                <p className="text-xs opacity-60">
                  {new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {loading && !approvalContext && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-blue-500" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map((delay) => (
                    <div
                      key={delay}
                      className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky bottom-0">
        {/* Approval Bar */}
        {approvalContext && (
          <div className="border-b bg-yellow-50/50 dark:bg-yellow-950/20 animate-in slide-in-from-bottom-4">
            <div className="px-4 py-4 max-w-4xl mx-auto space-y-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                  Review SQL — Approval Required
                </span>
                {approvalContext.content.sqlAttempts !== undefined && (
                  <span className="text-xs ml-auto px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                    Attempt #{approvalContext.content.sqlAttempts}
                  </span>
                )}
              </div>

              {approvalContext.content.generatedSql && (
                <div className="bg-background/60 rounded-lg p-3 border font-mono text-xs whitespace-pre-wrap">
                  {approvalContext.content.generatedSql}
                </div>
              )}

              <Textarea
                placeholder="Add feedback for regeneration (optional)..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="min-h-[60px] text-sm resize-none bg-background/60"
              />

              <div className="flex gap-2">
                <Button
                  onClick={() => handleApprove(true)}
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Approve &amp; Execute
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleApprove(false)}
                  disabled={loading}
                  className="flex-1"
                  size="sm"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Reject &amp; Regenerate
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-4">
          <div className="max-w-4xl mx-auto">
            {!isConfigured && !canChat && (
              <div className="mb-3 flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg px-3 py-2 border border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Configure your database and LLM first.</span>
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="ml-auto flex items-center gap-1 underline underline-offset-2 font-medium hover:no-underline"
                >
                  Open settings <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    canChat
                      ? "Ask anything about your database..."
                      : "Configure settings to get started"
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  disabled={
                    loading || !!approvalContext || !isConfigured || !canChat
                  }
                  className="pr-10 h-11 rounded-full shadow-sm"
                />
                {prompt && (
                  <button
                    onClick={() => setPrompt("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XCircle className="h-4 w-4" />
                  </button>
                )}
              </div>
              <Button
                onClick={sendMessage}
                disabled={
                  loading ||
                  !!approvalContext ||
                  !prompt.trim() ||
                  !isConfigured ||
                  !canChat
                }
                size="icon"
                className="h-11 w-11 rounded-full shadow-lg"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Press{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">
                Enter
              </kbd>{" "}
              to send
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
