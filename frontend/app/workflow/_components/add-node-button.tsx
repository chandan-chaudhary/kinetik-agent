"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { memo } from "react";

export const AddNodeButton = memo(() => {
  return (
    <Button onClick={() => {}} variant="outline" className="px-4 py-2 rounded">
      <PlusIcon className="h-6 w-6" />
    </Button>
  );
});

AddNodeButton.displayName = "AddNodeButton";
