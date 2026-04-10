"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Workflow,
  ArrowRight,
  Zap,
  Database,
  Sparkles,
  Activity,
  Clock3,
  Bot,
} from "lucide-react";
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
      status: "Soon",
      disabled: true,
    },
    {
      title: "Executions",
      description: "Monitor workflow runs and execution history",
      href: "/executions",
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
        {/* <Card className="overflow-hidden border-primary/20 bg-card/70 shadow-sm">
          <CardContent className="relative p-0">
            <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-workflow-action/10 to-workflow-trigger/10" />
            <div className="relative grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Live automations",
                  value: "12",
                  note: "+3 this week",
                  tone: "text-workflow-success",
                },
                {
                  label: "Avg execution time",
                  value: "2.4s",
                  note: "-18% faster",
                  tone: "text-workflow-action",
                },
                {
                  label: "Queue health",
                  value: "99.9%",
                  note: "all systems stable",
                  tone: "text-workflow-trigger",
                },
                {
                  label: "Pending approvals",
                  value: "5",
                  note: "2 high priority",
                  tone: "text-workflow-condition",
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="rounded-xl border border-border/60 bg-background/80 p-4 backdrop-blur-sm"
                >
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {metric.label}
                  </p>
                  <p className={`mt-2 text-2xl font-semibold ${metric.tone}`}>
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {metric.note}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}

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
                className={`group relative flex flex-col items-start gap-3 overflow-hidden rounded-xl border border-border/60 bg-card/60 p-4 text-left transition-all hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 ${accent.ring} ${accent.border} ${
                  disabled ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-40" />
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

        <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="relative overflow-hidden border-border/70 bg-card/70 lg:col-span-2">
            <CardContent className="relative p-6 sm:p-8">
              <div className="absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-workflow-action/10" />
              <div className="relative space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Sparkles className="h-3.5 w-3.5" />
                  Automation Command Center
                </div>
                <div className="max-w-xl space-y-2">
                  <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                    Design, deploy, and monitor workflows from one place
                  </h2>
                  <p className="text-sm text-muted-foreground sm:text-base">
                    Build intelligent flows, connect your data, and keep every
                    execution observable with real-time queue visibility.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                 
                  <Button asChild size="default">
                    <Link href="/chat-db">
                      <Database className="mr-2 h-4 w-4" />
                      Explore Data Assistant
                    </Link>
                  </Button>
                   <Button size="default" className="shadow-md" disabled={true} variant="secondary">
                    {/* <Link href="/workflow"> */}
                      {/* <Workflow className="mr-2 h-4 w-4" /> */}
                      Workflow Builder (soon)
                    {/* </Link> */}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* <Card className="border-border/70 bg-card/70">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Platform Pulse
                </h3>
                <Activity className="h-4 w-4 text-workflow-success" />
              </div>
              <div className="space-y-3">
                <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Bot className="h-4 w-4 text-workflow-action" />
                      AI Agent Activity
                    </span>
                    <span className="text-workflow-success">Active</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    8 tasks processed in the last 30 minutes
                  </p>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/70 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <Clock3 className="h-4 w-4 text-workflow-condition" />
                      Next scheduled run
                    </span>
                    <span>12m</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Daily market sync workflow is queued
                  </p>
                </div>
              </div>
            </CardContent>
          </Card> */}
        </section>
      </main>
    </div>
  );
}
