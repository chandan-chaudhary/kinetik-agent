"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useChatSessions,
  type ChatSessionSummary,
} from "@/hooks/useChatSession";
import {
  ArrowLeft,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { UserDisplay } from "@/components/UserDisplay";
import { useUser } from "@/contexts/UserContext";
import BrandLockup from "@/app/_components/BrandLockup";

type SidebarNavItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
};

interface ChatDbSidebarProps {
  sessions?: ChatSessionSummary[];
  activeSessionId?: string | null;
  isLoading?: boolean;
  isCreating?: boolean;
  onNewChat: () => Promise<void> | void;
  onSelectSession: (session: ChatSessionSummary) => void;
  onRenameSession: (id: string, title: string) => Promise<void> | void;
  onDeleteSession: (id: string) => Promise<void> | void;
}

export function ChatDbSidebar({
  activeSessionId,
  isCreating = false,
  onNewChat,
  onSelectSession,
  onRenameSession,
  onDeleteSession,
}: ChatDbSidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const pathname = usePathname();
  const { data: sessions, isLoading } = useChatSessions();
  const { user, isLoading: userLoading } = useUser();
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  const navigationItems: SidebarNavItem[] = [
    {
      key: "dashboard",
      label: "Dashboard",
      icon: ArrowLeft,
      href: "/dashboard",
    },
    {
      key: "new-chat",
      label: "New chat",
      icon: Plus,
      onClick: () => {
        void onNewChat();
      },
      disabled: isCreating,
    },
    {
      key: "chats",
      label: "Chats",
      icon: MessageSquare,
      href: "/chat-db",
    },
  ];

  const startRename = (session: ChatSessionSummary) => {
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
      collapsible="icon"
      className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
    >
      <SidebarHeader className="border-b border-sidebar-border">
        <div
          className={cn(
            "flex items-center px-3 py-3",
            isExpanded ? "justify-between gap-3" : "justify-center",
          )}
        >
          {isExpanded && (
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <BrandLockup variant="mobile" />
            </Link>
          )}

          <div className="flex items-center gap-1">
            <SidebarTrigger className="h-8 w-8 text-sidebar-foreground/80 hover:bg-sidebar-accent/50" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className=" pb-4 space-y-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 text-sm text-sidebar-foreground/80">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href &&
                  (pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href)));

                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild={Boolean(item.href)}
                      isActive={Boolean(isActive)}
                      tooltip={item.label}
                      className={cn(
                        "rounded-lg transition-colors hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                        isExpanded ? "px-3 py-2" : "px-2 py-2",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-foreground/90",
                      )}
                      onClick={item.onClick}
                      disabled={item.disabled}
                    >
                      {item.href ? (
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center",
                            isExpanded ? "gap-3" : "justify-center",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 text-sidebar-foreground/70",
                              isActive && "text-primary",
                            )}
                          />
                          {isExpanded && <span>{item.label}</span>}
                        </Link>
                      ) : (
                        <>
                          <Icon
                            className={cn(
                              "h-4 w-4 text-sidebar-foreground/70",
                              isActive && "text-primary",
                            )}
                          />
                          {isExpanded && <span>{item.label}</span>}
                        </>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isExpanded && (
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
                        <div className="flex w-full min-w-0 items-center gap-3 pr-6">
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
                            <div className="flex flex-1 min-w-0 items-center justify-between gap-2 text-xs text-sidebar-foreground/90">
                              <span className="block truncate">
                                {session.title}
                              </span>
                              {/* <span className="text-[10px] uppercase text-sidebar-foreground/60">
                                {session.dbType}
                              </span> */}
                            </div>
                          )}
                        </div>
                      </SidebarMenuButton>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <SidebarMenuAction
                            aria-label="Chat actions"
                            showOnHover
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </SidebarMenuAction>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          side="bottom"
                          sideOffset={6}
                          className="w-44 rounded-xl"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              startRename(session);
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span>Rename</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-500 focus:text-red-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              void onDeleteSession(session.id);
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border mt-auto">
        <UserDisplay user={user} isLoading={userLoading} />
      </SidebarFooter>
    </Sidebar>
  );
}
