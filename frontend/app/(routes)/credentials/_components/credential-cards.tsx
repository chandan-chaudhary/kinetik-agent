"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Pencil,
  Trash2,
  KeyRound,
  Database,
  Cpu,
  Layers,
  MoreVertical,
} from "lucide-react";
import type { Credential } from "@/hooks/useCredentials";

function getCredentialIcon(type: Credential["type"]) {
  if (type === "LLM") return Cpu;
  if (type === "DATABASE") return Database;
  return Layers;
}

export function CredentialCards({
  credentials,
  openEditDialog,
  handleDelete,
  isDeleting,
}: {
  credentials: Credential[];
  openEditDialog: (credential: Credential) => Promise<void> | void;
  handleDelete: (id: string) => Promise<void> | void;
  isDeleting: boolean;
}) {
  if (!credentials.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>
          <p className="font-medium">No credentials found</p>
          <p className="text-sm text-muted-foreground">
            Add your first credential to start reusing providers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
      {credentials.map((item) => {
        const Icon = getCredentialIcon(item.type);

        return (
          <Card
            key={item.id}
            className="h-full border border-border/70 shadow-sm hover:shadow-md transition-shadow"
          >
            <CardHeader className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base truncate">
                      {item.name}
                    </CardTitle>
                    <CardDescription className="wrap-break-word">
                      {item.type} • {item.preview || "Encrypted"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full border ${
                      item.isActive
                        ? "bg-green-500/10 text-green-600 border-green-500/30"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0"
                        aria-label="More actions"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => openEditDialog(item)}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleDelete(item.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="space-y-1">
                <p className="text-muted-foreground">Preview</p>
                <p className="font-medium break-words">
                  {item.preview || "Encrypted blob"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-muted-foreground">Last updated</p>
                <p className="font-medium">
                  {new Date(item.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
