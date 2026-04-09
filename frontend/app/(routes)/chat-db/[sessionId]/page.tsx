"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ChatDbHeader } from "@/app/(routes)/chat-db/_components/chat-db-header";
import { ChatDbSidebar } from "@/app/(routes)/chat-db/_components/chat-db-sidebar";
import { ChatApprovalPanel } from "@/app/(routes)/chat-db/_components/chat-approval-panel";
import { ChatEmptyState } from "@/app/(routes)/chat-db/_components/chat-empty-state";
import { ChatMessageItem } from "@/app/(routes)/chat-db/_components/chat-message-item";
import { ChatSessionLoadingSkeleton } from "@/app/(routes)/chat-db/_components/chat-session-loading-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  DbType,
  DEFAULT_DB_TYPE,
  isDbType,
  isLlmProvider,
} from "@/lib/types/chat-config";
import { useApproveDB, useQueryDB, type DBChatConfig } from "@/hooks/useChatDB";
import {
  type ChatMessage,
  type ChatSessionSummary,
  useChatSession,
  useCreateChatSession,
  useDeleteChatSession,
  useRenameChatSession,
  useUpdateChatSession,
} from "@/hooks/useChatSession";
import {
  AlertCircle,
  Bot,
  ChevronRight,
  Database,
  Loader2,
  Plus,
  Send,
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

const normalizeMessageContent = (content: unknown): string => {
  if (typeof content === "string") return content;
  if (content === null || content === undefined) return "";
  try {
    return JSON.stringify(content, null, 2);
  } catch {
    return String(content);
  }
};

const getMessageKey = (message: ChatMessage): string =>
  `${message.timestamp}-${message.role}`;

const DEFAULT_DB_CHAT_CONFIG: DBChatConfig = {
  dbType: DEFAULT_DB_TYPE,
  databaseUrl: "",
};

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

  // Load session data and messages
  const { data: session, isLoading: sessionLoading } = useChatSession(
    sessionId ?? undefined,
  );
  const createSession = useCreateChatSession();
  const deleteSession = useDeleteChatSession();
  const renameSession = useRenameChatSession();
  const updateSession = useUpdateChatSession();

  const queryMutation = useQueryDB();
  const approveMutation = useApproveDB();
  const loading = queryMutation.isPending || approveMutation.isPending;

  const activeSession = session ?? null;
  const sessionKey = sessionId ?? "__no_session__";
  const sessionMessages = sessionId ? messagesBySession[sessionKey] : undefined;
  const activeSessionMessages = session?.messages;

  // Messages for current session, preferring in-memory state for instant updates but falling back to session data for initial load or if no new messages have been added yet.
  const messages = useMemo(() => {
    if (!sessionId) return [] as ChatMessage[];
    const existing = sessionMessages ?? activeSessionMessages;
    return existing ?? [];
  }, [sessionId, sessionMessages, activeSessionMessages]);

  // Config data from session
  const sessionBackfilledConfig = useMemo<DBChatConfig | null>(() => {
    if (!activeSession) return null;
    return {
      dbType: isDbType(activeSession.dbType)
        ? activeSession.dbType
        : DbType.POSTGRES,
      databaseUrl: activeSession.databaseUrl || "",
      credentialId: activeSession.llmCredentialId || undefined,
      llmProvider: isLlmProvider(activeSession.llmProvider)
        ? activeSession.llmProvider
        : undefined,
      model: activeSession.llmModel || undefined,
      apiKey: activeSession.llmApiKey || undefined,
    };
  }, [activeSession]);

  // Persisted session config should win so fields auto-fill reliably.
  const effectiveConfig = sessionBackfilledConfig ?? config;
  const hasPersistedConfig = Boolean(
    (effectiveConfig?.databaseUrl || "").trim() &&
    (effectiveConfig?.credentialId || effectiveConfig?.llmProvider),
  );

  // chek can send message
  const canSend =
    !!sessionId &&
    (isConfigured || hasPersistedConfig) &&
    !loading &&
    !sessionLoading &&
    !settingsOpen;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, approvalContext]);

  useEffect(() => {
    if (!loading && !sessionLoading) inputRef.current?.focus();
  }, [loading, sessionLoading]);

  useEffect(() => {
    if (!sessionLoading && sessionId && !activeSession) {
      router.replace("/chat-db");
    }
  }, [sessionId, activeSession, router, sessionLoading]);

  const appendMessageForCurrentSession = (message: ChatMessage) => {
    setMessagesBySession((prev) => {
      const current = prev[sessionKey] ?? messages;
      return {
        ...prev,
        [sessionKey]: [...current, message],
      };
    });
  };

  const handleNewChat = async () => {
    const configForNewChat = effectiveConfig ?? DEFAULT_DB_CHAT_CONFIG;
    const session = await createSession.mutateAsync({
      dbType: configForNewChat.dbType,
      databaseUrl: configForNewChat.databaseUrl || undefined,
      llmCredentialId: configForNewChat.credentialId || undefined,
      llmProvider: configForNewChat.llmProvider,
      llmModel: configForNewChat.model,
      llmApiKey: configForNewChat.apiKey,
    });
    setMessagesBySession((prev) => ({
      ...prev,
      [session.id]: [],
    }));
    setApprovalContext(null);
    router.push(`/chat-db/${session.id}`);
  };

  const handleSelectSession = (session: ChatSessionSummary) => {
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
    if (!prompt.trim() || !canSend || !sessionId || !effectiveConfig) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: prompt,
      timestamp: new Date().toISOString(),
    };
    appendMessageForCurrentSession(userMsg);
    const currentPrompt = prompt;
    setPrompt("");

    const payload = {
      prompt: currentPrompt,
      sessionId,
      databaseUrl: effectiveConfig.databaseUrl,
      dbType: effectiveConfig.dbType,
      ...(effectiveConfig.credentialId
        ? { credentialId: effectiveConfig.credentialId }
        : {
            llmProvider: effectiveConfig.llmProvider,
            model: effectiveConfig.model,
            apiKey: effectiveConfig.apiKey,
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
          appendMessageForCurrentSession({
            role: "assistant",
            content: preview,
            sql:
              typeof data.content === "object"
                ? data.content.generatedSql
                : undefined,
            timestamp: new Date().toISOString(),
          });
          setApprovalContext({
            threadId: data.threadId!,
            content: ctx as ApprovalContext["content"],
          });
        } else if (data.completed) {
          appendMessageForCurrentSession({
            role: "assistant",
            content: normalizeMessageContent(data.content),
            timestamp: new Date().toISOString(),
          });
        }
      },
      onError: () => {
        appendMessageForCurrentSession({
          role: "system",
          content: "Failed to query database. Please try again.",
          timestamp: new Date().toISOString(),
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
            appendMessageForCurrentSession({
              role: "assistant",
              content: normalizeMessageContent(data.content),
              timestamp: new Date().toISOString(),
            });
          }
          setApprovalContext(null);
          setFeedback("");
        },
        onError: () => {
          appendMessageForCurrentSession({
            role: "system",
            content: "Failed to process approval.",
            timestamp: new Date().toISOString(),
          });
        },
      },
    );
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ChatDbSidebar
        // sessions={sessions}
        activeSessionId={sessionId}
        // isLoading={sessionsLoading}
        isCreating={createSession.isPending}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
      />

      <SidebarInset className="flex flex-col flex-1 min-w-0">
        <div className="flex flex-col flex-1 overflow-hidden">
          <ChatDbHeader
            key={activeSession?.id || "new-chat-db-config"}
            title={activeSession?.title || "Ask Database"}
            dbType={activeSession?.dbType}
            initialConfig={effectiveConfig ?? undefined}
            onConfigChange={(next) => setConfig(next)}
            onConfigSave={(next) => {
              setConfig(next);
              setIsConfigured(true);

              if (!sessionId) return;
              updateSession.mutate({
                id: sessionId,
                data: {
                  dbType: next.dbType,
                  databaseUrl: next.databaseUrl,
                  llmCredentialId: next.credentialId,
                  llmProvider: next.llmProvider,
                  llmModel: next.model,
                  llmApiKey: next.apiKey,
                },
              });
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
                  <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-blue-500 to-blue-600/60 flex items-center justify-center shadow-lg">
                    <Database className="h-8 w-8 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold">Talk to your Database</h2>
                  <p className="text-muted-foreground max-w-md text-sm">
                    Create a new chat or select an existing one from the
                    sidebar.
                  </p>
                  {!hasPersistedConfig && (
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
              ) : sessionLoading ? (
                <ChatSessionLoadingSkeleton />
              ) : messages.length === 0 ? (
                <ChatEmptyState
                  isConfigured={isConfigured}
                  onOpenSettings={() => setSettingsOpen(true)}
                  onSuggestionClick={setPrompt}
                />
              ) : (
                messages.map((msg) => (
                  <ChatMessageItem
                    key={getMessageKey(msg)}
                    message={msg}
                  />
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

          <div className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 sticky bottom-0 px-4 sm:px-5 lg:px-6">
            {approvalContext && (
              <ChatApprovalPanel
                content={approvalContext.content}
                feedback={feedback}
                loading={loading}
                onFeedbackChange={setFeedback}
                onApprove={() => handleApprove(true)}
                onReject={() => handleApprove(false)}
              />
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
                {sessionId && !sessionLoading && !hasPersistedConfig && (
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
                      sessionLoading
                        ? "Loading session..."
                        : canSend
                          ? "Ask anything about your database..."
                          : "Select a chat to start"
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    disabled={
                      loading ||
                      sessionLoading ||
                      !!approvalContext ||
                      !sessionId
                    }
                    className="h-11 rounded-full shadow-sm"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={
                      loading ||
                      sessionLoading ||
                      !!approvalContext ||
                      !prompt.trim() ||
                      !canSend
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
