export function ChatSessionLoadingSkeleton() {
  return (
    <div className="space-y-6 py-2">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-3 animate-pulse">
          <div className="w-8 h-8 rounded-full bg-muted/70 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-2/3 bg-muted/70 rounded" />
            <div className="h-4 w-1/2 bg-muted/60 rounded" />
            <div className="h-3 w-20 bg-muted/50 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
