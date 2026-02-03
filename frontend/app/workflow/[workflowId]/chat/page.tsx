"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";
import { API_BASE_URL } from "@/lib/utils";
import { Loader2, Send, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { useParams } from "next/navigation";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ApprovalContext {
  threadId: string;
  workflowId: string;
  generatedSql: string;
  queryResult: any[];
  userQuery: string;
}

export default function ChatPage() {
  const { workflowId } = useParams<{ workflowId: string }>();
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvalContext, setApprovalContext] =
    useState<ApprovalContext | null>(null);
  const [feedback, setFeedback] = useState("");

  const executeWorkflow = async () => {
    if (!prompt.trim()) return;

    const userMessage: Message = { role: "user", content: prompt };
    setMessages((prev) => [...prev, userMessage]);
    setPrompt("");
    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}workflow/${workflowId}/execute`,
        { prompt },
      );

      if (res.data.interrupted) {
        // Workflow interrupted for approval
        setApprovalContext({
          threadId: res.data.threadId,
          workflowId: workflowId,
          generatedSql: res.data.state?.generatedSql || "",
          queryResult: res.data.state?.queryResult || [],
          userQuery: res.data.state?.userQuery || prompt,
        });
      } else if (res.data.completed) {
        // Workflow completed
        const assistantMessage: Message = {
          role: "assistant",
          content: res.data.content,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Error executing workflow:", error);
      const errorMessage: Message = {
        role: "system",
        content: "Failed to execute workflow. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approved: boolean) => {
    if (!approvalContext) return;

    setLoading(true);

    try {
      const res = await axios.post(
        `${API_BASE_URL}/workflow/execution/${approvalContext.threadId}/approve`,
        {
          workflowId: approvalContext.workflowId,
          approved,
          feedback: approved ? undefined : feedback || "Please regenerate",
        },
      );

      if (res.data.completed) {
        const assistantMessage: Message = {
          role: "assistant",
          content: res.data.content,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }

      setApprovalContext(null);
      setFeedback("");
    } catch (error) {
      console.error("Error approving workflow:", error);
      const errorMessage: Message = {
        role: "system",
        content: "Failed to process approval. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background w-full">
      {/* Header */}
      <div className="border-b px-6 py-4">
        <h1 className="text-2xl font-bold">Workflow Chat</h1>
        <p className="text-sm text-muted-foreground">
          Interact with your workflow
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && !approvalContext && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="text-muted-foreground mb-4">
              <Send className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg">Start a conversation</p>
              <p className="text-sm">Ask a question to execute your workflow</p>
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <Card
              className={`max-w-[80%] ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : msg.role === "system"
                    ? "bg-destructive/10 border-destructive"
                    : "bg-muted"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  {msg.role === "assistant" && (
                    <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  )}
                  {msg.role === "system" && (
                    <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  )}
                  <p className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Approval Dialog */}
        {approvalContext && (
          <Card className="border-yellow-500 border-2 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                Approval Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2">User Query:</p>
                <p className="text-sm bg-muted p-3 rounded">
                  {approvalContext.userQuery}
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Generated SQL:</p>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded text-sm overflow-x-auto">
                  {approvalContext.generatedSql}
                </pre>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">Query Results:</p>
                <div className="bg-muted p-4 rounded max-h-60 overflow-auto">
                  <pre className="text-xs">
                    {JSON.stringify(approvalContext.queryResult, null, 2)}
                  </pre>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2">
                  Feedback (optional, for rejection):
                </p>
                <Textarea
                  placeholder="Provide feedback for regeneration..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-[80px]"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => handleApprove(true)}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleApprove(false)}
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject & Regenerate
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {loading && !approvalContext && (
          <div className="flex justify-center">
            <Card className="bg-muted">
              <CardContent className="p-4 flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm">Processing your request...</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="border-t p-4 bg-background">
        <div className="flex gap-2 max-w-4xl mx-auto">
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ask a question..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                executeWorkflow();
              }
            }}
            disabled={loading || !!approvalContext}
            className="flex-1"
          />
          <Button
            onClick={executeWorkflow}
            disabled={loading || !!approvalContext || !prompt.trim()}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
