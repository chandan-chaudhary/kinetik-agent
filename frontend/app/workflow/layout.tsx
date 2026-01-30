import Sidebar from "@/components/Sidebar";

export default function WorkflowLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex bg-surface-50">
      <Sidebar />
      {children}
    </div>
  );
}
