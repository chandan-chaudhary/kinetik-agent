"use client";

import { useMemo, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  useWorkflows,
  useCreateWorkflow,
  useDeleteWorkflow,
} from "@/hooks/useWorkflow";
import { toast } from "sonner";
import { Workflow } from "@/lib/types/types";
import {
  PlusIcon,
  Workflow as WorkflowIcon,
  Calendar,
  Clock,
  ArrowRight,
  Trash,
  Search,
} from "lucide-react";
import { generateSlug } from "random-word-slugs";
import WorkFlowHeader from "./_components/WorkFlowHeader";

export default function WorkflowPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRange, setFilterRange] = useState("all");
  const [nowTs] = useState(() => Date.now());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: workflows, isLoading, isError } = useWorkflows();
  const deleteWorkflow = useDeleteWorkflow();

  const filteredWorkflows = useMemo(() => {
    if (!workflows) return [];

    const query = searchTerm.trim().toLowerCase();

    return workflows.filter((workflow) => {
      const matchesQuery =
        !query ||
        workflow.name.toLowerCase().includes(query) ||
        (workflow.description ?? "").toLowerCase().includes(query);

      const createdAt = workflow.createdAt
        ? new Date(workflow.createdAt).getTime()
        : null;
      const updatedAt = workflow.updatedAt
        ? new Date(workflow.updatedAt).getTime()
        : null;

      let matchesFilter = true;
      if (filterRange === "recent") {
        matchesFilter = createdAt
          ? nowTs - createdAt <= 1000 * 60 * 60 * 24 * 30
          : false;
      } else if (filterRange === "updated") {
        matchesFilter = updatedAt
          ? nowTs - updatedAt <= 1000 * 60 * 60 * 24 * 30
          : false;
      }

      return matchesQuery && matchesFilter;
    });
  }, [workflows, searchTerm, filterRange, nowTs]);

  const openCreate = () => setIsCreating(true);
  const closeCreate = () => setIsCreating(false);

  const handleDelete = (id: string) => {
    setDeletingId(id);
    deleteWorkflow.mutate(id, {
      onSettled: () =>
        setDeletingId((current) => (current === id ? null : current)),
    });
  };

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
        {isError ? (
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
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search workflows by name or description"
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
              <div className="flex gap-3 w-full md:w-auto">
                <Select value={filterRange} onValueChange={setFilterRange}>
                  <SelectTrigger className="w-full md:w-52">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All workflows</SelectItem>
                    <SelectItem value="recent">
                      Created in last 30 days
                    </SelectItem>
                    <SelectItem value="updated">
                      Updated in last 30 days
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setFilterRange("all");
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>

            {isLoading ? (
              <div className="rounded-xl border bg-card/60 divide-y divide-border/70 shadow-sm">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="p-4 space-y-3 animate-pulse">
                    <div className="flex items-start gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-1/2 bg-muted rounded" />
                        <div className="h-4 w-3/4 bg-muted rounded" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <div className="h-3 w-28 bg-muted rounded" />
                      <div className="h-3 w-24 bg-muted rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : workflows && workflows.length > 0 ? (
              filteredWorkflows.length > 0 ? (
                <div className="rounded-xl border bg-card/60 divide-y divide-border/70 shadow-sm">
                  {filteredWorkflows.map((workflow: Workflow) => (
                    <Link
                      key={workflow.id}
                      href={`/workflow/${workflow.id}`}
                      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/60">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div className="rounded-lg bg-linear-to-br from-primary/15 to-primary/5 p-2.5">
                              <WorkflowIcon className="h-5 w-5 text-primary" />
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <CardTitle className="text-base font-semibold leading-tight line-clamp-1">
                                  {workflow.name}
                                </CardTitle>
                                {/* <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                                  Workflow
                                </span> */}
                              </div>
                              <CardDescription className="text-sm leading-relaxed line-clamp-2">
                                {workflow.description ||
                                  "No description provided"}
                              </CardDescription>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDelete(workflow.id);
                              }}
                              disabled={
                                deletingId === workflow.id &&
                                deleteWorkflow.isPending
                              }
                              aria-label="Delete workflow"
                            >
                              {deletingId === workflow.id && deleteWorkflow.isPending ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                              ) : (
                                <Trash className="h-4 w-4" />
                              )}
                            </Button>
                            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          {workflow.createdAt && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(workflow.createdAt).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                },
                              )}
                            </span>
                          )}
                          {workflow.updatedAt && (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
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
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="p-10 text-center space-y-3">
                    <h2 className="text-lg font-semibold">
                      No workflows match your filters
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Try a different search or clear filters to see all
                      workflows.
                    </p>
                    <div className="flex justify-center">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSearchTerm("");
                          setFilterRange("all");
                        }}
                      >
                        Reset filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="border-dashed">
                <CardContent className="p-16 text-center">
                  <div className="flex flex-col items-center gap-6 max-w-md mx-auto">
                    <div className="relative">
                      <div className="absolute inset-0 blur-2xl bg-linear-to-r from-primary/10 to-workflow-trigger/10 rounded-full" />
                      <div className="relative rounded-2xl bg-linear-to-br from-muted to-muted/50 p-6">
                        <WorkflowIcon className="h-12 w-12 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-semibold">
                        No workflows yet
                      </h2>
                      <p className="text-muted-foreground">
                        Get started by creating your first workflow to automate
                        your tasks and streamline your processes.
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

            {workflows && workflows.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-6">
                <p className="text-sm text-muted-foreground">
                  Showing {filteredWorkflows.length} of {workflows.length}{" "}
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
