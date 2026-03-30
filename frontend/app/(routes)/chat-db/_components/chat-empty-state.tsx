import { MessageSquare, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ChatEmptyStateProps {
  isConfigured: boolean;
  onOpenSettings: () => void;
  onSuggestionClick: (suggestion: string) => void;
}

const SUGGESTIONS = [
  "Show me all tables",
  "Count total records",
  "Show recent 10 entries",
];

export function ChatEmptyState({
  isConfigured,
  onOpenSettings,
  onSuggestionClick,
}: ChatEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
      <MessageSquare className="h-10 w-10 text-muted-foreground" />
      <p className="text-muted-foreground">
        No messages yet. Ask anything about your database!
      </p>
      {!isConfigured && (
        <Button variant="outline" size="sm" onClick={onOpenSettings}>
          <Settings className="h-4 w-4 mr-2" /> Configure connection
        </Button>
      )}
      <div className="flex flex-wrap gap-2 justify-center max-w-lg">
        {SUGGESTIONS.map((suggestion) => (
          <Button
            key={suggestion}
            variant="outline"
            size="sm"
            onClick={() => onSuggestionClick(suggestion)}
            className="text-xs"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}
