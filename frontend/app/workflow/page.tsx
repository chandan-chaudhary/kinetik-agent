"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useWorkflows, useCreateWorkflow } from "@/hooks/useWorkflow";
import { toast } from "sonner";
import { Workflow } from "@/lib/types/types";
import {
  PlusIcon,
  Workflow as WorkflowIcon,
  Calendar,
  Clock,
} from "lucide-react";
import { generateSlug } from "random-word-slugs";
import WorkFlowHeader from "./_components/WorkFlowHeader";

export default function WorkflowPage() {
  const [isCreating, setIsCreating] = useState(false);

  const { data: workflows, isLoading, isError } = useWorkflows();

  const openCreate = () => setIsCreating(true);
  const closeCreate = () => setIsCreating(false);

  return (
    <div className="flex-1">
      <WorkFlowHeader disabled={isCreating} openCreate={openCreate} />

      <CreateWorkflowSheet
        isCreating={isCreating}
        setIsCreating={setIsCreating}
        closeCreate={closeCreate}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="space-y-4 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 w-3/4 bg-muted rounded" />
                        <div className="h-4 w-full bg-muted rounded" />
                      </div>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="flex gap-4">
                      <div className="h-4 w-24 bg-muted rounded" />
                      <div className="h-4 w-24 bg-muted rounded" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-destructive/10 p-4">
                  <WorkflowIcon className="h-8 w-8 text-destructive" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-destructive mb-2">
                    Failed to load workflows
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Please try refreshing the page
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : workflows && workflows.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow: Workflow) => (
              <Link key={workflow.id} href={`/workflow/${workflow.id}`}>
                <Card className="workflow-card group overflow-hidden h-full hover:scale-[1.02] transition-transform duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 p-3 group-hover:from-primary/30 group-hover:to-primary/10 transition-all">
                        <WorkflowIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate mb-1 group-hover:text-primary transition-colors">
                          {workflow.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-sm">
                          {workflow.description || "No description provided"}
                        </CardDescription>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-border space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>
                          {new Date(workflow.createdAt!).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            },
                          )}
                        </span>
                      </div>
                      {workflow.updatedAt && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          <span>
                            Updated{" "}
                            {new Date(workflow.updatedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="p-16 text-center">
              <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
                <div className="relative">
                  <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-primary/10 to-workflow-trigger/10 rounded-full" />
                  <div className="relative rounded-2xl bg-gradient-to-br from-muted to-muted/50 p-6">
                    <WorkflowIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-semibold">No workflows yet</h2>
                  <p className="text-muted-foreground">
                    Get started by creating your first workflow to automate your
                    tasks and streamline your processes.
                  </p>
                </div>
                <Button onClick={openCreate} size="lg" className="mt-2">
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create your first workflow
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {workflows && workflows.length > 0 && (
          <div className="flex items-center justify-between mt-8 pt-6 border-t">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {workflows.length}
              </span>{" "}
              workflow
              {workflows.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function CreateWorkflowSheet({
  isCreating,
  setIsCreating,
  closeCreate,
}: {
  isCreating: boolean;
  setIsCreating: (open: boolean) => void;
  closeCreate: () => void;
}) {
  const router = useRouter();
  const createMutation = useCreateWorkflow();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Workflow name is required");
      return;
    }

    const payload: Workflow = {
      name: name.trim(),
      description: description.trim(),
    };

    createMutation.mutate(payload, {
      onSuccess: (data) => {
        toast.success("Workflow created successfully!");
        setName("");
        setDescription("");
        closeCreate();

        // Navigate to the newly created workflow
        if (data?.id) {
          router.push(`/workflow/${data.id}`);
        }
      },
      onError: () => {
        toast.error("Failed to create workflow");
      },
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setName("");
      setDescription("");
    }
    setIsCreating(open);
  };

  if (isCreating && name.trim() === "") {
    const generatedName = generateSlug(3);
    setName(generatedName);
  }

  return (
    <Sheet open={isCreating} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <WorkflowIcon className="h-5 w-5 text-primary" />
            </div>
            <SheetTitle className="text-xl">Create new workflow</SheetTitle>
          </div>
          <SheetDescription>
            Give your workflow a meaningful name and description to help you
            identify it later.
          </SheetDescription>
        </SheetHeader>

        <div className="p-8 flex flex-col gap-6">
          <div className="space-y-3">
            <label
              htmlFor="workflow-name"
              className="text-sm font-semibold flex items-center gap-1"
            >
              Workflow Name
              <span className="text-destructive">*</span>
            </label>
            <Input
              id="workflow-name"
              placeholder="e.g., customer-onboarding-flow"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11"
              autoFocus
            />
            <p className="text-xs text-muted-foreground">
              Use a descriptive name with lowercase and hyphens
            </p>
          </div>

          <div className="space-y-3">
            <label
              htmlFor="workflow-description"
              className="text-sm font-semibold"
            >
              Description
            </label>
            <Input
              id="workflow-description"
              placeholder="What does this workflow do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Optional: Explain the purpose of this workflow
            </p>
          </div>
        </div>

        <SheetFooter className="gap-3">
          <Button
            variant="outline"
            onClick={closeCreate}
            className="flex-1 h-11"
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            className="flex-1 h-11"
            disabled={createMutation.isPending || !name.trim()}
          >
            {createMutation.isPending ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2" />
                Creating...
              </>
            ) : (
              <>
                <PlusIcon className="h-4 w-4 mr-2" />
                Create workflow
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
