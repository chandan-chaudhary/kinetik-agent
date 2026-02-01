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
} from "@/components/ui/sidebar";
import {
  Workflow,
  Activity,
  Settings,
  CreditCard,
  LogOut,
  Home,
} from "lucide-react";

const navigationItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/workflow", label: "Workflows", icon: Workflow },
  { href: "/executions", label: "Executions", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

const footerItems = [
  { href: "/billing", label: "Billing Portal", icon: CreditCard },
  { href: "/logout", label: "Sign out", icon: LogOut },
];

export default function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-3 px-4 py-4">
          <Image
            src="/kinetik-application-logo.png"
            alt="Kinetik Logo"
            width={36}
            height={36}
            className="w-9 h-9"
          />
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">Kinetik</span>
            <span className="text-xs text-sidebar-foreground/60">
              AI in Motion
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
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
                    px-3 py-2.5 rounded-lg transition-all duration-200
                    ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                        : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80 hover:text-sidebar-foreground"
                    }
                  `}
                >
                  <Link href={item.href} className="flex items-center gap-3">
                    <Icon
                      className={`h-4 w-4 ${isActive ? "text-primary" : ""}`}
                    />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border mt-auto">
        <SidebarMenu className="px-2 py-4 space-y-1">
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
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
