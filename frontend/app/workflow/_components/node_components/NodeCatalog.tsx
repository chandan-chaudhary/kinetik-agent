"use client";
import { useState, useEffect } from "react";
import { NodeTemplate, NodeTemplatesGrouped } from "@/lib/types/workflow.types";
import { fetchNodeTemplates } from "@/hooks/workflow.api";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface NodeCatalogProps {
  open: boolean;
  onClose: () => void;
  onSelectNode: (template: NodeTemplate) => void;
}

export function NodeCatalog({ open, onClose, onSelectNode }: NodeCatalogProps) {
  const [templates, setTemplates] = useState<NodeTemplatesGrouped>({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        const data = await fetchNodeTemplates();
        setTemplates(data);
      } catch (error) {
        console.error("Failed to load node templates:", error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      loadTemplates();
    }
  }, [open]);

  const filteredTemplates = () => {
    let allTemplates: NodeTemplate[] = [];

    if (selectedDomain) {
      allTemplates = templates[selectedDomain] || [];
    } else {
      allTemplates = Object.values(templates).flat();
    }

    if (searchQuery) {
      return allTemplates.filter(
        (t) =>
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.description.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    return allTemplates;
  };

  const domains = Object.keys(templates);

  return (
    <Sheet open={open} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Node Library</SheetTitle>
          <SheetDescription>
            Select a node to add to your workflow
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Search */}
          <Input
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Domain Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              size="sm"
              variant={selectedDomain === null ? "default" : "outline"}
              onClick={() => setSelectedDomain(null)}
            >
              All
            </Button>
            {domains.map((domain) => (
              <Button
                key={domain}
                size="sm"
                variant={selectedDomain === domain ? "default" : "outline"}
                onClick={() => setSelectedDomain(domain)}
              >
                {domain.toUpperCase()}
              </Button>
            ))}
          </div>

          {/* Node List */}
          {loading ? (
            <div className="text-center py-8">Loading nodes...</div>
          ) : (
            <div className="space-y-2">
              {filteredTemplates().map((template) => (
                <div
                  key={template.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => {
                    onSelectNode(template);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {template.icon && (
                        <span className="text-2xl">{template.icon}</span>
                      )}
                      <div>
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-gray-600">
                          {template.description}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {template.domain}
                          </span>
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {template.kind}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {filteredTemplates().length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No nodes found
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
