import Image from "next/image";
import { cn } from "@/lib/utils";

type BrandLockupProps = {
  variant?: "desktop" | "mobile";
  className?: string;
};

export default function BrandLockup({
  variant = "desktop",
  className,
}: BrandLockupProps) {
  const isDesktop = variant === "desktop";

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Image
        src="/kinetik-application-logo.png"
        alt="Kinetik Logo"
        width={isDesktop ? 40 : 30}
        height={isDesktop ? 40 : 30}
        className={isDesktop ? "h-10 w-10" : "h-8 w-8"}
      />
      <div className="flex flex-col">
        <span
          className={cn(
            "font-bold tracking-tight text-foreground",
            isDesktop ? "text-2xl" : "text-base font-semibold",
          )}
        >
          KINETIK
        </span>
        <span
          className={cn(
            "text-xs",
            isDesktop ? "text-sidebar-foreground/60" : "text-muted-foreground",
          )}
        >
          AI in Motion
        </span>
      </div>
    </div>
  );
}
