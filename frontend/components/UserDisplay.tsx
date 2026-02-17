"use client";

import {
  User as UserIcon,
  LogOut,
  Settings,
  Home,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useUser } from "@/contexts/UserContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  userId: string;
  email: string;
  name?: string;
}

interface UserDisplayProps {
  user: User | null;
  isLoading: boolean;
  variant?: "sidebar" | "header";
}

export function UserDisplay({
  user,
  isLoading,
  variant = "sidebar",
}: UserDisplayProps) {
  const router = useRouter();
  const { logout } = useUser();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (isLoading) {
    if (variant === "header") {
      return <div className="w-20 h-9 bg-muted/50 rounded animate-pulse" />;
    }
    return (
      <div className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-muted/50 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-muted/50 rounded animate-pulse w-24" />
            <div className="h-2 bg-muted/50 rounded animate-pulse w-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (variant === "header") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 hover:bg-accent rounded-md px-3 py-2 transition-colors">
            <div className="w-8 h-8 bg-linear-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-white" />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium text-foreground">
                {user.name || user.email.split("@")[0]}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="px-4 py-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-3 w-full hover:bg-sidebar-accent rounded-md p-2 transition-colors">
            <div className="w-10 h-10 bg-linear-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center">
              <UserIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user.name || user.email.split("@")[0]}
              </p>
              <p className="text-xs text-sidebar-foreground/60 truncate">
                {user.email}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-sidebar-foreground/60" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onClick={() => router.push("/dashboard")}>
            <Home className="w-4 h-4 mr-2" />
            Dashboard
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push("/settings")}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
