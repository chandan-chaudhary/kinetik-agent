import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Workflow } from "lucide-react";

type AuthCardHeaderProps = {
  title: string;
  description: string;
};

export default function AuthCardHeader({
  title,
  description,
}: AuthCardHeaderProps) {
  return (
    <CardHeader className="space-y-4 border-b border-border/70">
      <div className="mx-auto flex flex-col items-center gap-2 pb-1">
        <Image
          src="/kinetik-application-logo.png"
          alt="Kinetik Logo"
          width={52}
          height={52}
          className="h-[52px] w-[52px] rounded"
        />
        <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground">
          KINETIK PLATFORM
        </p>
      </div>

      <div className="flex items-center gap-3">
        <div className="gradient-cta rounded-2xl p-3 text-primary-foreground shadow-md">
          <Workflow className="h-5 w-5" />
        </div>
        <div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {title}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {description}
          </CardDescription>
        </div>
      </div>
    </CardHeader>
  );
}
