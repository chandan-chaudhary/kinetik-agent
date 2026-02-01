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
import { Workflow, ArrowRight, Zap, GitBranch } from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-background to-muted/20 font-sans">
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Dashboard
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Manage your workflows and automations from one central hub
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card
            className="workflow-card group cursor-pointer hover:scale-[1.02] transition-transform"
            onClick={() => router.push("/workflow")}
          >
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-xl bg-gradient-to-br from-workflow-trigger/20 to-workflow-trigger/5 p-3">
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
                <div className="rounded-xl bg-gradient-to-br from-workflow-action/20 to-workflow-action/5 p-3">
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

          <Card className="workflow-card opacity-60 cursor-not-allowed">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="rounded-xl bg-gradient-to-br from-workflow-loop/20 to-workflow-loop/5 p-3">
                  <GitBranch className="h-6 w-6 text-workflow-loop" />
                </div>
                <CardTitle className="text-xl">Integrations</CardTitle>
              </div>
              <CardDescription>
                Connect to external services and APIs
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
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-6 max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-primary/20 via-workflow-action/20 to-workflow-trigger/20 rounded-full" />
                <div className="relative rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 shadow-2xl shadow-primary/20">
                  <Workflow className="h-12 w-12 text-primary-foreground" />
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Ready to automate?</h2>
                <p className="text-muted-foreground">
                  Create your first workflow and start automating your processes
                  today
                </p>
              </div>
              <Button asChild size="lg" className="mt-2 shadow-lg">
                <Link href="/workflow">
                  <Workflow className="mr-2 h-5 w-5" />
                  Create Workflow
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
