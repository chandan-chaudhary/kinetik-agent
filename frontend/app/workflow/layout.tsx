import Sidebar from "@/components/Sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <Sidebar />
      <main className="w-full flex bg-surface-50">{children}</main>
    </SidebarProvider>
  );
}
