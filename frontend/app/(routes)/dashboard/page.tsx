"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Workflow, ArrowRight, Zap, Database } from "lucide-react";
import Link from "next/link";
import EntityHeader from "@/components/entity-header";
import { Card, CardContent } from "@/components/ui/card";

export default function Dashboard() {
  const router = useRouter();

  const quickActions = [
    {
      title: "Talk to DB",
      description: "Query your database using natural language with AI",
      href: "/chat-db",
      icon: Database,
      accent: {
        text: "text-blue-500",
        bg: "from-blue-500/15 to-blue-500/5",
        ring: "focus-visible:ring-blue-500/50",
        border: "hover:border-blue-500/40",
        badgeBorder: "border-blue-500/30",
        badgeBg: "bg-blue-500/10",
      },
      status: "Live",
      disabled: false,
    },
    {
      title: "Workflows",
      description: "View and manage all your automated workflows",
      href: "/workflow",
      icon: Workflow,
      accent: {
        text: "text-emerald-500",
        bg: "from-emerald-500/15 to-emerald-500/5",
        ring: "focus-visible:ring-emerald-500/50",
        border: "hover:border-emerald-500/40",
        badgeBorder: "border-emerald-500/30",
        badgeBg: "bg-emerald-500/10",
      },
      status: "Updated",
      disabled: false,
    },
    {
      title: "Executions",
      description: "Monitor workflow runs and execution history",
      href: "#",
      icon: Zap,
      accent: {
        text: "text-amber-500",
        bg: "from-amber-500/15 to-amber-500/5",
        ring: "focus-visible:ring-amber-500/50",
        border: "hover:border-amber-500/40",
        badgeBorder: "border-amber-500/30",
        badgeBg: "bg-amber-500/10",
      },
      status: "Soon",
      disabled: true,
    },
  ];

  return (
    <div className="flex-1 bg-linear-to-b from-background to-muted/20">
      <EntityHeader
        title="Dashboard"
        description="Manage your workflows and automations from one central hub"
      />

      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => {
            const {
              title,
              description,
              href,
              icon: Icon,
              accent,
              status,
              disabled,
            } = action;

            return (
              <Card
                key={title}
                onClick={() => !disabled && router.push(href)}
                onKeyDown={(e) => {
                  if (disabled) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(href);
                  }
                }}
                role="button"
                tabIndex={disabled ? -1 : 0}
                aria-disabled={disabled}
                className={`group relative flex flex-col items-start gap-3 rounded-xl border border-border/60 bg-card/60 p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 ${accent.ring} ${accent.border} ${
                  disabled ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`rounded-xl bg-linear-to-br ${accent.bg} p-3`}
                  >
                    <Icon className={`h-6 w-6 ${accent.text}`} />
                  </div>
                  <span
                    className={`rounded-full border ${accent.badgeBorder} ${accent.badgeBg} px-3 py-1 text-[10px] font-semibold uppercase tracking-wide ${accent.text}`}
                  >
                    {status}
                  </span>
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    {title}
                    {!disabled && (
                      <ArrowRight
                        className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${accent.text}`}
                      />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="rounded-2xl border-dashed border-primary/30 bg-primary/5 p-0 text-center shadow-inner">
          <CardContent className="flex flex-col items-center gap-4 p-6 max-w-2xl mx-auto">
            <div className="rounded-xl bg-linear-to-br from-primary to-primary/80 p-4 shadow-lg shadow-primary/30">
              <Workflow className="h-7 w-7 text-primary-foreground" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Build your next workflow</h2>
              <p className="text-sm text-muted-foreground">
                Launch the visual builder to connect triggers, actions, and
                databases in minutes.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button asChild size="default" className="shadow-md">
                <Link href="/workflow">
                  <Workflow className="mr-2 h-4 w-4" />
                  Create workflow
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
