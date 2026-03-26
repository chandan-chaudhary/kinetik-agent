"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type ChatSession } from "@/hooks/useChatSession";
import {
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

interface ChatDbSidebarProps {
  sessions?: ChatSession[];
  activeSessionId?: string | null;
  isLoading?: boolean;
  isCreating?: boolean;
  onNewChat: () => Promise<void> | void;
  onSelectSession: (session: ChatSession) => void;
  onRenameSession: (id: string, title: string) => Promise<void> | void;
  onDeleteSession: (id: string) => Promise<void> | void;
}

export function ChatDbSidebar({
  sessions,
  activeSessionId,
  isLoading = false,
  isCreating = false,
  onNewChat,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
}: ChatDbSidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  const startRename = (session: ChatSession) => {
    setRenamingId(session.id);
    setRenameValue(session.title);
  };

  const submitRename = async (sessionId: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null);
      setRenameValue("");
      return;
    }
    await onRenameSession(sessionId, renameValue.trim());
    setRenamingId(null);
    setRenameValue("");
  };

  return (
    <Sidebar
      collapsible="none"
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <SidebarHeader className="border-b border-sidebar-border px-3 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Image
              src="/kinetik-application-logo.png"
              alt="App logo"
              width={28}
              height={28}
              className="rounded-md"
            />
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">Kinetik</p>
              <p className="text-[11px] uppercase text-sidebar-foreground/60">
                Database AI
              </p>
            </div>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 text-sidebar-foreground/80 hover:bg-sidebar-accent/50"
            onClick={onNewChat}
            disabled={isCreating}
            aria-label="New chat"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 pb-4 space-y-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 text-sm text-sidebar-foreground/80">
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="px-3 py-2 rounded-lg transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  onClick={() => onNewChat()}
                  disabled={isCreating}
                >
                  <Plus className="h-4 w-4 text-primary" />
                  <span>New chat</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton className="px-3 py-2 rounded-lg text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground">
                  <Search className="h-4 w-4 text-sidebar-foreground/70" />
                  <span>Search</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="px-3 py-2 rounded-lg text-sidebar-foreground/90 transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                >
                  <Link href="/chat-db" className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-sidebar-foreground/70" />
                    <span>Chats</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[11px] uppercase tracking-wide text-sidebar-foreground/70">
            Recents
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                <div className="space-y-1 px-1">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-9 w-full" />
                  ))}
                </div>
              ) : sessions && sessions.length > 0 ? (
                sessions.map((session) => (
                  <SidebarMenuItem key={session.id}>
                    <SidebarMenuButton
                      isActive={activeSessionId === session.id}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm transition-colors",
                        activeSessionId === session.id
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground/85 hover:bg-sidebar-accent/50",
                      )}
                      onClick={() => onSelectSession(session)}
                    >
                      <div className="flex w-full items-center gap-3">
                        {/* <MessageSquare className="h-4 w-4 text-sidebar-foreground/60" /> */}
                        {renamingId === session.id ? (
                          <input
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => submitRename(session.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") submitRename(session.id);
                              if (e.key === "Escape") {
                                setRenamingId(null);
                                setRenameValue("");
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 bg-transparent text-xs outline-none border-b border-sidebar-border"
                          />
                        ) : (
                          <div className="flex flex-1 items-center justify-between gap-2 text-xs text-sidebar-foreground/90">
                            <span className="truncate">{session.title}</span>
                            {/* <span className="text-[10px] uppercase text-sidebar-foreground/60">
                              {session.dbType}
                            </span> */}
                          </div>
                        )}
                      </div>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      aria-label="Rename chat"
                      showOnHover
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(session);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </SidebarMenuAction>
                    <SidebarMenuAction
                      aria-label="Delete chat"
                      showOnHover
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteSession(session.id);
                      }}
                      className="right-8"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </SidebarMenuAction>
                    <SidebarMenuAction
                      aria-label="More actions"
                      showOnHover
                      className="right-14"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))
              ) : (
                <div className="px-3 py-8 text-center text-xs text-sidebar-foreground/60">
                  No chats yet. Create one to get started.
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <div className="px-3 pt-2 text-xs text-sidebar-foreground/60">
          <Link href="/chat-db" className="underline underline-offset-2">
            Back to list
          </Link>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
