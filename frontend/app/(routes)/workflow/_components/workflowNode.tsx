"use client";

import { Button } from "@/components/ui/button";
import { NodeToolbar, Position } from "@xyflow/react";
import { Settings, Trash } from "lucide-react";

interface WorkFLowNodesProps {
  children: React.ReactNode;
  showToolbar?: boolean;
  onDelete?: () => void;
  onSettings?: () => void;
  name?: string;
  description?: string;
}
export function WorkFlowNode({
  children,
  showToolbar,
  onDelete,
  onSettings,
  name,
  description,
}: WorkFLowNodesProps) {
  return (
    <>
      {showToolbar && (
        <NodeToolbar className=" flex gap-2">
          <Button variant='outline' size="sm" onClick={onSettings}>
            <Settings className="size-4" />
          </Button>
          <Button variant='outline' size="sm" onClick={onDelete}>
            <Trash className="size-4" />
          </Button>
        </NodeToolbar>
      )}
      {children}
      {name && (
        <NodeToolbar position={Position.Bottom} isVisible>
          <div className="text-center">
            <p className="font-semibold text-sm">{name}</p>
            {description && (
              <p className="text-xs text-muted-foreground truncate">
                {description}
              </p>
            )}
          </div>
        </NodeToolbar>
      )}
    </>
  );
}
