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
import WorkFlowHeader from "@/components/workflow/WorkFlowHeader";
import {
  PlusIcon,
  Workflow as WorkflowIcon,
  Calendar,
  Clock,
} from "lucide-react";
import { generateSlug } from "random-word-slugs";

export default function WorkflowPage() {
  const [isCreating, setIsCreating] = useState(false);

  const { data: workflows, isLoading, isError } = useWorkflows();

  const openCreate = () => setIsCreating(true);
  const closeCreate = () => setIsCreating(false);

  return (
    <div className="flex-1 p-2">
      <WorkFlowHeader disabled={isCreating} openCreate={openCreate} />

      <CreateWorkflowSheet
        isCreating={isCreating}
        setIsCreating={setIsCreating}
        closeCreate={closeCreate}
      />

      {/* Main Content */}
      <main className="p-4 sm:p-8">
        {isLoading ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-muted-foreground">Loading workflows...</p>
              </div>
            </CardContent>
          </Card>
        ) : isError ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-destructive">Failed to load workflows</p>
            </CardContent>
          </Card>
        ) : workflows && workflows.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((workflow: Workflow) => (
              <Link key={workflow.id} href={`/workflow/${workflow.id}`}>
                <Card className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 p-2">
                  <CardContent className="p-2">
                    <div className="flex items-start gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <WorkflowIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {workflow.name}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {workflow.description || "No description provided"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground border-t pt-4">
                      <div className="flex items-center gap-2 ">
                        <Calendar className="h-3 w-3" />
                        <span>
                          Created:{" "}
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
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            Updated:{" "}
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
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="rounded-full bg-muted p-4">
                  <PlusIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold mb-2">
                    No workflows yet
                  </h2>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    Get started by creating your first workflow to automate your
                    tasks
                  </p>
                  <Button onClick={openCreate} className="w-full sm:w-auto">
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Create workflow
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {workflows && workflows.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Showing {workflows.length} workflow
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
      userId: "default-user",
    };

    createMutation.mutate(payload, {
      onSuccess: (data) => {
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
    // if (open && name.trim() === "") {
    //   setName(generateSlug(3));
    // }
    setIsCreating(open);
  };
  if (isCreating && name.trim() === "") {
    const generatedName = generateSlug(3);
    setName(generatedName);
  }
  return (
    <Sheet open={isCreating} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Create new workflow</SheetTitle>
          <SheetDescription>
            Give your workflow a name and description to get started
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 flex flex-col gap-4">
          <div className="space-y-2">
            <label htmlFor="workflow-name" className="text-sm font-medium">
              Name <span className="text-destructive">*</span>
            </label>
            <Input
              id="workflow-name"
              placeholder="e.g., customer-onboarding-flow"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="workflow-description"
              className="text-sm font-medium"
            >
              Description
            </label>
            <Input
              id="workflow-description"
              placeholder="What does this workflow do?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter>
          <div className="flex flex-col-reverse sm:flex-row gap-2 w-full">
            <Button
              variant="outline"
              onClick={closeCreate}
              className="w-full sm:w-auto"
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="w-full sm:w-auto"
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
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
