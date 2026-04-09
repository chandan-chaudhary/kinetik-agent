"use client";

import { useMemo, useState } from "react";
import EntityHeader from "@/components/entity-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Activity,
  CalendarRange,
  Clock3,
  Filter,
  PlayCircle,
  Zap,
} from "lucide-react";

type ExecutionStatus = "success" | "failed" | "running";

type ExecutionItem = {
  id: string;
  name: string;
  status: ExecutionStatus;
  startedAt: string;
};

const executionItems: ExecutionItem[] = [];

export default function ExecutionsPage() {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | ExecutionStatus>(
    "all",
  );

  const filteredExecutions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return executionItems.filter((execution) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        execution.name.toLowerCase().includes(normalizedQuery);

      const matchesFilter =
        activeFilter === "all" || execution.status === activeFilter;

      return matchesQuery && matchesFilter;
    });
  }, [query, activeFilter]);

  const hasExecutions = executionItems.length > 0;

  return (
    <div className="flex-1 bg-linear-to-b from-background to-muted/20">
      <EntityHeader
        title="Executions"
        description="Monitor workflow runs, status, and execution timeline."
      />

      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        <Card className="border-border/70 bg-card/70 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Successful
                </p>
                <p className="mt-2 text-2xl font-bold text-emerald-600">0</p>
              </div>
              <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Failed
                </p>
                <p className="mt-2 text-2xl font-bold text-rose-600">0</p>
              </div>
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Running
                </p>
                <p className="mt-2 text-2xl font-bold text-blue-600">0</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/70 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Filter className="h-4 w-4 text-amber-500" />
              Filter executions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 md:flex-row">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search execution by workflow name"
                className="md:flex-1"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={activeFilter === "all" ? "default" : "outline"}
                  onClick={() => setActiveFilter("all")}
                  className="gap-2"
                >
                  <Activity className="h-4 w-4" />
                  All
                </Button>
                <Button
                  type="button"
                  variant={activeFilter === "running" ? "default" : "outline"}
                  onClick={() => setActiveFilter("running")}
                  className="gap-2"
                >
                  <PlayCircle className="h-4 w-4" />
                  Running
                </Button>
                <Button
                  type="button"
                  variant={activeFilter === "success" ? "default" : "outline"}
                  onClick={() => setActiveFilter("success")}
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Success
                </Button>
                <Button
                  type="button"
                  variant={activeFilter === "failed" ? "default" : "outline"}
                  onClick={() => setActiveFilter("failed")}
                  className="gap-2"
                >
                  <Clock3 className="h-4 w-4" />
                  Failed
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {!hasExecutions || filteredExecutions.length === 0 ? (
          <Card className="border-dashed border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-10 sm:p-14 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-amber-500/20 to-amber-500/10">
                <CalendarRange className="h-7 w-7 text-amber-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold tracking-tight">
                  No executions yet
                </h2>
                <p className="mx-auto max-w-xl text-sm text-muted-foreground">
                  Execution history will appear here once workflows are run. You
                  can use search and status filters to quickly find runs when
                  data is available.
                </p>
              </div>
              <div className="inline-flex items-center rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-700">
                Placeholder mode enabled
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">
                Execution list rendering will be connected in a follow-up
                update.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
