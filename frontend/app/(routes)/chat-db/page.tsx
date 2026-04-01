"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Plus,
  Database,
  Loader2,
  ChevronRight,
} from "lucide-react";
import EntityHeader from "@/components/entity-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarInset } from "@/components/ui/sidebar";
import { ChatDbSidebar } from "@/app/(routes)/chat-db/_components/chat-db-sidebar";
import {
  useChatSessions,
  useCreateChatSession,
  useDeleteChatSession,
  useRenameChatSession,
  type ChatSessionSummary,
} from "@/hooks/useChatSession";

function formatDate(value?: string) {
  if (!value) return "Unknown time";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return date.toLocaleString();
}

export default function ChatDBListPage() {
  const router = useRouter();
  const { data: sessions, isLoading } = useChatSessions();
  const createSession = useCreateChatSession();
  const deleteSession = useDeleteChatSession();
  const renameSession = useRenameChatSession();
  const [search, setSearch] = useState("");

  const handleOpen = (id: string) => router.push(`/chat-db/${id}`);

  const handleNewChat = async () => {
    const session = await createSession.mutateAsync({});
    handleOpen(session.id);
  };

  const handleSelectSession = (session: ChatSessionSummary) => {
    handleOpen(session.id);
  };

  const handleRenameSession = async (id: string, title: string) => {
    if (!title.trim()) return;
    await renameSession.mutateAsync({ id, title: title.trim() });
  };

  const handleDeleteSession = async (id: string) => {
    await deleteSession.mutateAsync(id);
  };

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    const q = search.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((session) => {
      const titleMatch = session.title.toLowerCase().includes(q);
      const dbMatch = (session.dbType || "").toLowerCase().includes(q);
      return titleMatch || dbMatch;
    });
  }, [sessions, search]);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ChatDbSidebar
        isCreating={createSession.isPending}
        onNewChat={handleNewChat}
        onSelectSession={handleSelectSession}
        onRenameSession={handleRenameSession}
        onDeleteSession={handleDeleteSession}
      />

      <SidebarInset className="flex flex-col flex-1 min-w-0">
        <div className="flex-1 w-full">
          <EntityHeader
            title="Database chats"
            description="Pick a conversation to continue or start a new one."
          >
            <Button
              onClick={handleNewChat}
              disabled={createSession.isPending}
              className="gap-2"
            >
              {createSession.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">New chat</span>
            </Button>
          </EntityHeader>

          <div className="px-4 pb-8 sm:px-6 lg:px-8 py-2">
            <div className="max-w-7xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search chats by title or DB type..."
                  className="w-full "
                />
              </div>

              {isLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="h-16 rounded-xl border bg-muted/40 animate-pulse"
                    />
                  ))}
                </div>
              ) : filteredSessions.length > 0 ? (
                <div className="divide-y rounded-xl border bg-card/70">
                  {filteredSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleOpen(session.id)}
                      className="group w-full px-4 py-3 text-left transition hover:bg-muted/60"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          {/* <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <MessageSquare className="h-4 w-4" />
                          </span> */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold leading-tight line-clamp-1">
                                {session.title}
                              </p>
                              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase text-muted-foreground">
                                <Database className="h-3 w-3" />
                                {session.dbType}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Last updated {formatDate(session.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border bg-muted/40 p-10 text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
                      {search.trim()
                        ? "No chats match your search"
                        : "No chats yet"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {search.trim()
                        ? "Try a different title or database name."
                        : "Start a conversation with your database and it will show up here."}
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Button
                      onClick={handleNewChat}
                      disabled={createSession.isPending}
                      className="gap-2"
                    >
                      {createSession.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      New chat
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </div>
  );
}
