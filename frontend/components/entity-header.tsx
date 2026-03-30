"use client";
import Link from "next/link";
import { Button } from "./ui/button";
import { SidebarTrigger } from "./ui/sidebar";
import Image from "next/image";

export type EntityHeaderProps = {
  title: string;
  description?: string;
  newButtonLabel?: string;
  isCreating?: boolean;
  isDisabled?: boolean;
  icon?: React.ComponentType<{ className?: string }> | string;
  children?: React.ReactNode;
} & (
  | { onNew: () => void; newButtonHref?: never }
  | { newButtonHref: string; onNew?: never }
  | { onNew?: never; newButtonHref?: never }
);

export default function EntityHeader({
  title,
  description,
  newButtonLabel,
  isCreating,
  isDisabled,
  onNew,
  newButtonHref,
  icon: Icon,
  children,
}: EntityHeaderProps) {
  return (
    <div className="sticky top-0 z-50 glass border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-3 sm:py-4">
          <div className="flex min-w-0 items-start gap-3 sm:items-center sm:gap-4">
            <SidebarTrigger className="md:hidden hover:bg-muted rounded-lg transition-colors shrink-0" />
            <div className="flex min-w-0 items-start gap-3 sm:items-center">
              <div className="h-px w-6 bg-border hidden sm:block" />
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight leading-tight truncate">
                  {title}
                </h1>
                {description && (
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 sm:mt-0.5 leading-snug">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 justify-end">
            {children}

            {onNew && !newButtonHref ? (
              <Button
                onClick={onNew}
                disabled={isDisabled || isCreating}
                size="default"
                className="gap-2 shadow-sm hover:shadow-md transition-all"
              >
                {typeof Icon === "string" ? (
                  <Image src={Icon} alt={title} width={18} height={18} />
                ) : Icon ? (
                  <Icon className="h-4 w-4" />
                ) : null}
                <span className="hidden sm:inline">
                  {newButtonLabel || "New"}
                </span>
              </Button>
            ) : null}

            {newButtonHref && !onNew ? (
              <Button
                asChild
                disabled={isDisabled || isCreating}
                size="default"
                className="gap-2 shadow-sm hover:shadow-md transition-all"
              >
                <Link href={newButtonHref}>
                  {typeof Icon === "string" ? (
                    <Image src={Icon} alt={title} width={18} height={18} />
                  ) : Icon ? (
                    <Icon className="h-4 w-4" />
                  ) : null}
                  <span className="hidden sm:inline">
                    {newButtonLabel || "New"}
                  </span>
                </Link>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
