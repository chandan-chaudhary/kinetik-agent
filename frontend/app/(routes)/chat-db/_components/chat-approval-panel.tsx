import { AlertCircle, CheckCircle, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ApprovalContent {
  generatedSql?: string;
}

interface ChatApprovalPanelProps {
  content: ApprovalContent;
  feedback: string;
  loading: boolean;
  onFeedbackChange: (value: string) => void;
  onApprove: () => void;
  onReject: () => void;
}

export function ChatApprovalPanel({
  content,
  feedback,
  loading,
  onFeedbackChange,
  onApprove,
  onReject,
}: ChatApprovalPanelProps) {
  return (
    <div className="border-b bg-yellow-50/50 dark:bg-yellow-950/20">
      <div className="py-4 w-full space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">
            Review SQL - Approval Required
          </span>
        </div>
        {content.generatedSql && (
          <div className="bg-background/60 rounded-lg p-3 border font-mono text-xs whitespace-pre-wrap">
            {content.generatedSql}
          </div>
        )}
        <Textarea
          placeholder="Add feedback (optional)..."
          value={feedback}
          onChange={(e) => onFeedbackChange(e.target.value)}
          className="min-h-[60px] text-sm resize-none bg-background/60"
        />
        <div className="flex gap-2">
          <Button
            onClick={onApprove}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve & Execute
              </>
            )}
          </Button>
          <Button
            variant="destructive"
            onClick={onReject}
            disabled={loading}
            className="flex-1"
            size="sm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <XCircle className="h-4 w-4 mr-2" />
                Reject & Regenerate
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
