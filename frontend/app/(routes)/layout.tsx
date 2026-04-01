"use client";

import { usePathname } from "next/navigation";

import { AuthGuard } from "@/components/AuthGuard";
import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideSidebar = pathname?.startsWith("/chat-db") ?? false;

  if (hideSidebar) {
    return <AuthGuard>{children}</AuthGuard>;
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <Sidebar />
        <main className="w-full flex bg-surface-50">{children}</main>
      </SidebarProvider>
    </AuthGuard>
  );
}
