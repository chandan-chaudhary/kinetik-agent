"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatDbHeader } from "@/app/(routes)/chat-db/_components/chat-db-header";
import { ChatDbSidebar } from "@/app/(routes)/chat-db/_components/chat-db-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SidebarInset } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useApproveDB, useQueryDB, type DBChatConfig } from "@/hooks/useChatDB";
import {
  type ChatMessage,
  type ChatSession,
  useChatSessions,
  useCreateChatSession,
  useDeleteChatSession,
  useRenameChatSession,
} from "@/hooks/useChatSession";
import {
  AlertCircle,
  Bot,
  CheckCircle,
  ChevronRight,
  Code,
  Database,
  Loader2,
  MessageSquare,
  Plus,
  Send,
  User,
  XCircle,
  Settings,
} from "lucide-react";

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

export default function ChatDBSessionPage() {
  const params = useParams<{ sessionId?: string }>();
  const router = useRouter();
  const sessionId = Array.isArray(params?.sessionId)
    ? params.sessionId[0]
    : (params?.sessionId ?? null);

  const [messagesBySession, setMessagesBySession] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [config, setConfig] = useState<DBChatConfig | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [approvalContext, setApprovalContext] =
    useState<ApprovalContext | null>(null);
  const [feedback, setFeedback] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const createSession = useCreateChatSession();
  const deleteSession = useDeleteChatSession();
  const renameSession = useRenameChatSession();

  const queryMutation = useQueryDB();
  const approveMutation = useApproveDB();
  const loading = queryMutation.isPending || approveMutation.isPending;

  const activeSession = sessions?.find((s) => s.id === sessionId) ?? null;
  const sessionKey = sessionId ?? "__no_session__";
  const sessionMessages = sessionId ? messagesBySession[sessionKey] : undefined;
  const activeSessionMessages = activeSession?.messages;
  const messages = useMemo(() => {
    if (!sessionId) return [] as ChatMessage[];
    const existing = sessionMessages ?? activeSessionMessages;
    return existing ?? [];
  }, [sessionId, sessionMessages, activeSessionMessages]);
  const canSend = !!sessionId && isConfigured && !loading && !settingsOpen;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, approvalContext]);

  useEffect(() => {
    if (!loading) inputRef.current?.focus();
  }, [loading]);

  useEffect(() => {
    if (!sessionsLoading && sessionId && !activeSession) {
      router.replace("/chat-db");
    }
  }, [sessionId, activeSession, sessionsLoading, router]);

  const handleNewChat = async () => {
    const configForNewChat = config ?? {
      dbType: "postgres",
      databaseUrl: "",
      llmProvider: undefined,
      model: "",
      apiKey: "",
    };
    const session = await createSession.mutateAsync({
      dbType: configForNewChat.dbType,
      databaseUrl: configForNewChat.databaseUrl || undefined,
    });
    setMessagesBySession((prev) => ({
      ...prev,
      [session.id]: [],
    }));
    setApprovalContext(null);
    router.push(`/chat-db/${session.id}`);
  };

  const handleSelectSession = (session: ChatSession) => {
    setApprovalContext(null);
    setFeedback("");
    router.push(`/chat-db/${session.id}`);
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession.mutateAsync(id);
    if (sessionId === id) {
      setMessagesBySession((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      router.push("/chat-db");
    }
  };

  const handleRenameSession = async (id: string, title: string) => {
    if (title.trim()) {
      await renameSession.mutateAsync({ id, title: title.trim() });
    }
  };

  const sendMessage = () => {
    if (!prompt.trim() || !canSend || !sessionId || !config) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    setMessagesBySession((prev) => {
      const current = prev[sessionKey] ?? messages;
      return {
        ...prev,
        [sessionKey]: [...current, userMsg],
      };
    });
    const currentPrompt = prompt;
    setPrompt("");

    const payload = {
      prompt: currentPrompt,
      sessionId,
      databaseUrl: config.databaseUrl,
      dbType: config.dbType,
      ...(config.credentialId
        ? { credentialId: config.credentialId }
        : {
            llmProvider: config.llmProvider,
            model: config.model,
            apiKey: config.apiKey,
          }),
    };

    queryMutation.mutate(payload, {
      onSuccess: (data) => {
        if (data.interrupted) {
          const ctx =
            typeof data.content === "object" && data.content !== null
              ? data.content
              : { question: "Approval required" };
          const preview =
            typeof data.content === "object"
              ? data.content.generatedSql || data.content.question
              : String(data.content ?? "Approval required");
          setMessagesBySession((prev) => {
            const current = prev[sessionKey] ?? messages;
            return {
              ...prev,
              [sessionKey]: [
                ...current,
                {
                  role: "assistant",
                  content: preview,
                  sql:
                    typeof data.content === "object"
                      ? data.content.generatedSql
                      : undefined,
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          });
          setApprovalContext({
            threadId: data.threadId!,
            content: ctx as ApprovalContext["content"],
          });
        } else if (data.completed) {
          const content =
            typeof data.content === "string"
              ? data.content
              : JSON.stringify(data.content, null, 2);
          setMessagesBySession((prev) => {
            const current = prev[sessionKey] ?? messages;
            return {
              ...prev,
              [sessionKey]: [
                ...current,
                {
                  role: "assistant",
                  content,
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          });
        }
      },
      onError: () => {
        setMessagesBySession((prev) => {
          const current = prev[sessionKey] ?? messages;
          return {
            ...prev,
            [sessionKey]: [
              ...current,
              {
                role: "system",
                content: "Failed to query database. Please try again.",
                timestamp: new Date().toISOString(),
              },
            ],
          };
        });
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
            setMessagesBySession((prev) => {
              const current = prev[sessionKey] ?? messages;
              return {
                ...prev,
                [sessionKey]: [
                  ...current,
                  {
                    role: "assistant",
                    content: data.content ?? "",
                    timestamp: new Date().toISOString(),
                  },
                ],
              };
            });
          }
          setApprovalContext(null);
          setFeedback("");
        },
        onError: () => {
          setMessagesBySession((prev) => {
            const current = prev[sessionKey] ?? messages;
            return {
              ...prev,
              [sessionKey]: [
                ...current,
                {
                  role: "system",
                  content: "Failed to process approval.",
                  timestamp: new Date().toISOString(),
                },
              ],
            };
          });
        },
      },
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ChatDbSidebar
        sessions={sessions}
        activeSessionId={sessionId}
        isLoading={sessionsLoading}
        isCreating={createSession.isPending}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
      />

      <SidebarInset className="flex flex-col flex-1 min-w-0">
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatDbHeader
            title={activeSession?.title || "Ask Database"}
            dbType={activeSession?.dbType}
            initialConfig={config ?? undefined}
            onConfigChange={(next) => setConfig(next)}
            onConfigSave={(next) => {
              setConfig(next);
              setIsConfigured(true);
            }}
            onStatusChange={({
              config: nextConfig,
              isConfigured,
              settingsOpen,
            }) => {
              setConfig(nextConfig);
              setIsConfigured(isConfigured);
              setSettingsOpen(settingsOpen);
            }}
          />

          <div className="flex-1 overflow-y-auto px-4 sm:px-5 lg:px-6 py-6">
            <div className="w-full space-y-6">
              {!sessionId ? (
                <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600/60 flex items-center justify-center shadow-lg">
                    <Database className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Talk to your Database</h2>
                  <p className="text-muted-foreground max-w-md text-sm">
                    Create a new chat or select an existing one from the
                    sidebar.
                  </p>
                  {!isConfigured && (
                    <p className="text-xs text-yellow-600 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" />
                      Configure your database and LLM first
                    </p>
                  )}
                  <Button
                    onClick={handleNewChat}
                    disabled={createSession.isPending}
                  >
                    <Plus className="h-4 w-4 mr-2" /> New Chat
                  </Button>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No messages yet. Ask anything about your database!
                  </p>
                  {!isConfigured && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettingsOpen(true)}
                    >
                      <Settings className="h-4 w-4 mr-2" /> Configure connection
                    </Button>
                  )}
                  <div className="flex flex-wrap gap-2 justify-center max-w-lg">
                    {[
                      "Show me all tables",
                      "Count total records",
                      "Show recent 10 entries",
                    ].map((s) => (
                      <Button
                        key={s}
                        variant="outline"
                        size="sm"
                        onClick={() => setPrompt(s)}
                        className="text-xs"
                      >
                        {s}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300",
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
                            ? "bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 text-yellow-900 dark:text-yellow-100"
                            : "bg-muted rounded-tl-sm",
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      {msg.sql && (
                        <div className="bg-background/60 rounded-lg p-3 border">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                            <Code className="h-3 w-3" /> Generated SQL
                          </div>
                          <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                            {msg.sql}
                          </pre>
                        </div>
                      )}
                      <p className="text-xs opacity-50">
                        {new Date(msg.timestamp).toLocaleTimeString([], {
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
                ))
              )}

              {loading && !approvalContext && (
                <div className="flex gap-3">
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

          <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky bottom-0 px-4 sm:px-5 lg:px-6">
            {approvalContext && (
              <div className="border-b bg-yellow-50/50 dark:bg-yellow-950/20">
                <div className="py-4 w-full space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                      Review SQL — Approval Required
                    </span>
                  </div>
                  {approvalContext.content.generatedSql && (
                    <div className="bg-background/60 rounded-lg p-3 border font-mono text-xs whitespace-pre-wrap">
                      {approvalContext.content.generatedSql}
                    </div>
                  )}
                  <Textarea
                    placeholder="Add feedback (optional)..."
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
                          Approve & Execute
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
                          Reject & Regenerate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="py-4">
              <div className="w-full">
                {!sessionId && (
                  <div className="mb-3 flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg px-3 py-2 border border-yellow-200">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Select or create a chat first.</span>
                    <button
                      onClick={handleNewChat}
                      className="ml-auto flex items-center gap-1 underline font-medium"
                    >
                      New Chat <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
                {sessionId && !isConfigured && (
                  <div className="mb-3 flex items-center gap-2 text-xs text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg px-3 py-2 border border-yellow-200">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>Configure connection first.</span>
                    <button
                      onClick={() => setSettingsOpen(true)}
                      className="ml-auto flex items-center gap-1 underline font-medium"
                    >
                      Settings <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={
                      canSend
                        ? "Ask anything about your database..."
                        : "Select a chat to start"
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={loading || !!approvalContext || !sessionId}
                    className="h-11 rounded-full shadow-sm"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={
                      loading || !!approvalContext || !prompt.trim() || !canSend
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
      </SidebarInset>
    </div>
  );
}
