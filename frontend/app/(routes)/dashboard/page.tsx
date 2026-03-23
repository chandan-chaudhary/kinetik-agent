"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Workflow, ArrowRight, Zap, Database } from "lucide-react";
import Link from "next/link";
import EntityHeader from "@/components/entity-header";

export default function Dashboard() {
  const router = useRouter();

  return (
    <div className="flex-1 bg-linear-to-b from-background to-muted/20">
      <EntityHeader
        title="Dashboard"
        description="Manage your workflows and automations from one central hub"
      />

      <main className="container mx-auto px-4 py-6 sm:px-6 lg:px-8 space-y-8">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card
            className="workflow-card group cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => router.push("/chat-db")}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-xl bg-linear-to-br from-blue-500/20 to-blue-500/5 p-3">
                  <Database className="h-6 w-6 text-blue-500" />
                </div>
                <CardTitle className="text-xl">Talk to DB</CardTitle>
              </div>
              <CardDescription>
                Query your database using natural language with AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                className="w-full justify-between group-hover:bg-muted"
              >
                Open DB Chat
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          <Card
            className="workflow-card group cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => router.push("/workflow")}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-xl bg-linear-to-br from-workflow-trigger/20 to-workflow-trigger/5 p-3">
                  <Workflow className="h-6 w-6 text-workflow-trigger" />
                </div>
                <CardTitle className="text-xl">Workflows</CardTitle>
              </div>
              <CardDescription>
                View and manage all your automated workflows
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                className="w-full justify-between group-hover:bg-muted"
              >
                Go to Workflows
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="workflow-card opacity-60 cursor-not-allowed">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-xl bg-linear-to-br from-workflow-action/20 to-workflow-action/5 p-3">
                  <Zap className="h-6 w-6 text-workflow-action" />
                </div>
                <CardTitle className="text-xl">Executions</CardTitle>
              </div>
              <CardDescription>
                Monitor workflow runs and execution history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="ghost"
                className="w-full justify-between"
                disabled
              >
                Coming Soon
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Get Started Section */}
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4 max-w-xl mx-auto">
              <div className="relative">
                <div className="rounded-xl bg-linear-to-br from-primary to-primary/80 p-4 shadow-lg shadow-primary/20">
                  <Workflow className="h-8 w-8 text-primary-foreground" />
                </div>
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-bold">Ready to automate?</h2>
                <p className="text-sm text-muted-foreground">
                  Create your first workflow and start automating your processes
                </p>
              </div>
              <Button asChild size="default" className="shadow-lg">
                <Link href="/workflow">
                  <Workflow className="mr-2 h-4 w-4" />
                  Create Workflow
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
