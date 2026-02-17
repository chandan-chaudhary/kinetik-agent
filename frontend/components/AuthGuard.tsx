"use client";

import { ReactNode } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";

interface AuthGuardProps {
  children: ReactNode;
  redirectTo?: string;
  fallback?: ReactNode;
}

export function AuthGuard({
  children,
  redirectTo = "/",
  fallback,
}: AuthGuardProps) {
  const { user, isLoading } = useRequireAuth(redirectTo);

  if (isLoading) {
    return (
      fallback ?? (
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-sm text-muted-foreground">Checking authentication…</p>
        </div>
      )
    );
  }

  if (!user) {
    return fallback ?? null;
  }

  return <>{children}</>;
}
