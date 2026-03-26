"use client";

import type { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function ChatDbLayout({ children }: { children: ReactNode }) {
  return <SidebarProvider>{children}</SidebarProvider>;
}
