"use client";

import Link from "next/link";
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
import { Workflow, Activity, Home, KeyIcon, Database } from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import { UserDisplay } from "@/components/UserDisplay";
import BrandLockup from "@/app/_components/BrandLockup";

const navigationItems = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/chat-db", label: "Chat DB", icon: Database },
  { href: "/workflow", label: "Workflows", icon: Workflow },
  { href: "/executions", label: "Executions", icon: Activity },
  { href: "/credentials", label: "Credentials", icon: KeyIcon },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const { user, isLoading } = useUser();
  const { state } = useSidebar();
  const isExpanded = state === "expanded";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div
          className={`flex items-center px-3 py-3 ${isExpanded ? "justify-between" : "justify-center"}`}
        >
          {isExpanded && (
            <Link href="/" className="flex items-center gap-3 min-w-0">
              <BrandLockup variant="mobile" />
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
      </SidebarFooter>
    </Sidebar>
  );
}
