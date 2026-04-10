"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MessageSquare,
  Plus,
  Database,
  Loader2,
  ChevronRight,
  Search,
  Calendar,
  ChevronLeft,
} from "lucide-react";
import EntityHeader from "@/components/entity-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [filterValue, setFilterValue] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [nowTs] = useState(() => Date.now());

  const PAGE_SIZE = 8;

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

    return sessions.filter((session) => {
      const matchesQuery =
        !q ||
        session.title.toLowerCase().includes(q) ||
        (session.dbType || "").toLowerCase().includes(q);

      let matchesFilter = true;
      if (filterValue === "recent") {
        const updatedAt = session.updatedAt
          ? new Date(session.updatedAt).getTime()
          : null;
        matchesFilter = updatedAt
          ? nowTs - updatedAt <= 1000 * 60 * 60 * 24 * 30
          : false;
      } else if (filterValue.startsWith("db:")) {
        const dbTypeFilter = filterValue.replace("db:", "");
        matchesFilter = (session.dbType || "").toLowerCase() === dbTypeFilter;
      }

      return matchesQuery && matchesFilter;
    });
  }, [sessions, search, filterValue, nowTs]);

  const dbFilterOptions = useMemo(() => {
    if (!sessions) return [];

    return [
      ...new Set(sessions.map((session) => session.dbType?.toLowerCase())),
    ]
      .filter((value): value is string => Boolean(value))
      .sort();
  }, [sessions]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSessions.length / PAGE_SIZE),
  );
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSessions = useMemo(() => {
    const start = (safeCurrentPage - 1) * PAGE_SIZE;
    return filteredSessions.slice(start, start + PAGE_SIZE);
  }, [filteredSessions, safeCurrentPage]);

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

          <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div className="space-y-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="relative w-full md:max-w-sm">
                  <Input
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search chats by title or DB type"
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <Select
                    value={filterValue}
                    onValueChange={(value) => {
                      setFilterValue(value);
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-full md:w-56">
                      <SelectValue placeholder="Filter chats" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All chats</SelectItem>
                      <SelectItem value="recent">
                        Updated in last 30 days
                      </SelectItem>
                      {dbFilterOptions.map((dbType) => (
                        <SelectItem key={dbType} value={`db:${dbType}`}>
                          {dbType.toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch("");
                      setFilterValue("all");
                      setCurrentPage(1);
                    }}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              {isLoading ? (
                <div className="rounded-xl border bg-card/60 divide-y divide-border/70 shadow-sm">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div key={idx} className="p-4 space-y-3 animate-pulse">
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 w-1/2 bg-muted rounded" />
                          <div className="h-4 w-1/3 bg-muted rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : paginatedSessions.length > 0 ? (
                <>
                  <div className="divide-y rounded-xl border bg-card/70">
                    {paginatedSessions.map((session) => (
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
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Last updated {formatDate(session.updatedAt)}
                                </span>
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-1" />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Page {safeCurrentPage} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(1, prev - 1))
                        }
                        disabled={safeCurrentPage === 1}
                      >
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage((prev) =>
                            Math.min(totalPages, prev + 1),
                          )
                        }
                        disabled={safeCurrentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border bg-muted/40 p-10 text-center space-y-4">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-semibold">
                      {search.trim() || filterValue !== "all"
                        ? "No chats match your filters"
                        : "No chats yet"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {search.trim() || filterValue !== "all"
                        ? "Try a different search term or clear filters."
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
          </main>
        </div>
      </SidebarInset>
    </div>
  );
}
