"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Send,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Bot,
  Code,
  Database,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useExecuteWorkflow, useApproveWorkflow } from "@/hooks/useWorkflow";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ApprovalContext {
  threadId: string;
  workflowId: string;
  content: {
    question: string;
    response: string;
  };
}

export default function ChatPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [approvalContext, setApprovalContext] =
    useState<ApprovalContext | null>(null);
  const [feedback, setFeedback] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const executeMutation = useExecuteWorkflow();
  const approveMutation = useApproveWorkflow();

  const loading = executeMutation.isPending || approveMutation.isPending;

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, approvalContext]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const executeWorkflow = async () => {
    if (!prompt.trim()) return;

    const userMessage: Message = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    const currentPrompt = prompt;
    setPrompt("");

    executeMutation.mutate(
      { workflowId, prompt: currentPrompt },
      {
        onSuccess: (data) => {
          if (data.interrupted) {
            // Show content as assistant message
            const contentString =
              typeof data.content === "string"
                ? data.content
                : data.content?.response || "Approval required to proceed.";

            const assistantMessage: Message = {
              role: "assistant",
              content: contentString,
            };
            setMessages((prev) => [...prev, assistantMessage]);

            setApprovalContext({
              threadId: data.threadId!,
              workflowId: workflowId,
              content: data.content as { question: string; response: string },
            });
          } else if (data.completed) {
            const contentString =
              typeof data.content === "string"
                ? data.content
                : JSON.stringify(data.content, null, 2);

            const assistantMessage: Message = {
              role: "assistant",
              content: contentString || "",
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
        },
        onError: () => {
          const errorMessage: Message = {
            role: "system",
            content: "Failed to execute workflow. Please try again.",
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      },
    );
  };

  const handleApprove = async (approved: boolean) => {
    if (!approvalContext) return;

    approveMutation.mutate(
      {
        threadId: approvalContext.threadId,
        workflowId: approvalContext.workflowId,
        approved,
        feedback: approved ? undefined : feedback || "Please regenerate",
      },
      {
        onSuccess: (data) => {
          if (data.completed) {
            const assistantMessage: Message = {
              role: "assistant",
              content: data.content || "",
            };
            setMessages((prev) => [...prev, assistantMessage]);
          }
          setApprovalContext(null);
          setFeedback("");
        },
        onError: () => {
          const errorMessage: Message = {
            role: "system",
            content: "Failed to process approval. Please try again.",
          };
          setMessages((prev) => [...prev, errorMessage]);
        },
      },
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/20 w-full">
      {/* Compact Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Workflow Assistant</h1>
              <p className="text-xs text-muted-foreground">
                AI-powered workflow execution
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Welcome Message */}
          {messages.length === 0 && !approvalContext && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg">
                  <Bot className="h-10 w-10 text-primary-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Ready to Help</h2>
                <p className="text-muted-foreground max-w-md">
                  I can execute workflows, query databases, and help you
                  automate tasks. What would you like to do?
                </p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt("Show me all users in the database")}
                  className="text-xs"
                >
                  Show all users
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt("Count total records")}
                  className="text-xs"
                >
                  Count records
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPrompt("Get recent activity")}
                  className="text-xs"
                >
                  Recent activity
                </Button>
              </div>
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
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                  {msg.role === "assistant" ? (
                    <Bot className="h-4 w-4 text-primary" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                  )}
                </div>
              )}

              <div
                className={cn(
                  "rounded-2xl px-4 py-3 max-w-[85%] shadow-sm",
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
                <p className="text-xs opacity-60 mt-1">
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

          {/* Typing Indicator */}
          {loading && !approvalContext && (
            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-4">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Bot className="h-4 w-4 text-primary" />
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky bottom-0">
        {/* Approval Bar */}
        {approvalContext && (
          <div className="border-b bg-yellow-50/50 dark:bg-yellow-950/20 animate-in slide-in-from-bottom-4">
            <div className="px-4 py-3">
              <div className="max-w-4xl mx-auto space-y-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
                  <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
                    Approval Required
                  </span>
                </div>

                {/* Display the question */}
                <p className="text-sm text-yellow-900 dark:text-yellow-100">
                  {approvalContext.content.question}
                </p>

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
                        Approve
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
                        Reject
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="px-4 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Type your message..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      executeWorkflow();
                    }
                  }}
                  disabled={loading || !!approvalContext}
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
                onClick={executeWorkflow}
                disabled={loading || !!approvalContext || !prompt.trim()}
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
              to send ·{" "}
              <kbd className="px-1.5 py-0.5 rounded bg-muted text-xs">
                Shift + Enter
              </kbd>{" "}
              for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
