"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Workflow,
  Activity,
  Home,
  KeyIcon,
  // Settings,
  Database,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { UserDisplay } from "@/components/UserDisplay";

const navigationItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/chat-db", label: "Chat DB", icon: Database },
  { href: "/workflow", label: "Workflows", icon: Workflow },
  { href: "/executions", label: "Executions", icon: Activity },
  { href: "/credentials", label: "Credentials", icon: KeyIcon },
];

// const footerItems = [{ href: "/settings", label: "Settings", icon: Settings }];

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useUser();
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div
          className={`flex items-center px-4 py-4 ${isExpanded ? "justify-between" : "justify-center"}`}
        >
          {isExpanded && (
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <Image
                src="/kinetik-application-logo.png"
                alt="Kinetik Logo"
                width={36}
                height={36}
                className="w-9 h-9"
              />
              <div className="flex flex-col">
                <span className="text-xl font-bold text-foreground tracking-tight">
                  KINETIK
                </span>
                <span className="text-xs text-sidebar-foreground/60">
                  AI in Motion
                </span>
              </div>
            </Link>
          )}
          <SidebarTrigger className="hover:bg-muted rounded-lg transition-colors shrink-0" />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-2">
        <SidebarMenu className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  className={`
                    py-2.5 rounded-lg transition-all duration-200
                    ${isExpanded ? "px-3" : "px-2"}
                    ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                        : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                    }
                  `}
                >
                  <Link
                    href={item.href}
                    className={`flex items-center ${isExpanded ? "gap-3" : "justify-center"}`}
                  >
                    <Icon
                      className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                    />
                    {isExpanded && <span>{item.label}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border mt-auto">
        <UserDisplay user={user} isLoading={isLoading} />

        {/* Footer Menu Items */}
        {/* <SidebarMenu className="px-2 py-2 space-y-1">
          {footerItems.map((item) => {
            const Icon = item.icon;

            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  className="px-3 py-2.5 rounded-lg hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground transition-all duration-200"
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <Icon className="h-4 w-4" />
                    {state === "expanded" && <span>{item.label}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu> */}
      </SidebarFooter>
    </Sidebar>
  );
}
