import { AlertCircle, Bot, Code, User } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/hooks/useChatSession";
import { ChatMessageRenderer } from "./chat-message-render";

interface ChatMessageItemProps {
  message: ChatMessage;
}

export function ChatMessageItem({ message }: ChatMessageItemProps) {
  return (
    <div
      className={cn(
        "flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300",
        message.role === "user" ? "justify-end" : "justify-start",
      )}
    >
      {message.role !== "user" && (
        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-1">
          {message.role === "assistant" ? (
            <Bot className="h-4 w-4 text-blue-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          )}
        </div>
      )}
      <div
        className={cn(
          "rounded-2xl px-4 py-3 shadow-sm space-y-2",
          message.role === "user"
            ? "max-w-[75%] bg-primary text-primary-foreground rounded-tr-sm text-sm"
            : message.role === "system"
              ? "max-w-[85%] bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 text-yellow-900 dark:text-yellow-100 text-sm"
              : "max-w-[85%] bg-muted rounded-tl-sm",
        )}
      >
        {message.role === "user" ? (
          <p className="leading-relaxed whitespace-pre-wrap wrap-break-word">
            {message.content}
          </p>
        ) : (
          <ChatMessageRenderer content={message.content} />
        )}

        {message.sql && (
          <div className="bg-background/60 rounded-lg p-3 border">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
              <Code className="h-3 w-3" /> Generated SQL
            </div>
            <pre className="text-xs font-mono whitespace-pre-wrap break-all">
              {message.sql}
            </pre>
          </div>
        )}
        <p className="text-xs opacity-40">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      {message.role === "user" && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
          <User className="h-4 w-4 text-primary-foreground" />
        </div>
      )}
    </div>
  );
}

// import { AlertCircle, Bot, Code, User } from "lucide-react";
// import { cn } from "@/lib/utils";
// import type { ChatMessage } from "@/hooks/useChatSession";

// interface ChatMessageItemProps {
//   message: ChatMessage;
// }

// export function ChatMessageItem({ message }: ChatMessageItemProps) {
//   return (
//     <div
//       className={cn(
//         "flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300",
//         message.role === "user" ? "justify-end" : "justify-start",
//       )}
//     >
//       {message.role !== "user" && (
//         <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0 mt-1">
//           {message.role === "assistant" ? (
//             <Bot className="h-4 w-4 text-blue-500" />
//           ) : (
//             <AlertCircle className="h-4 w-4 text-yellow-600" />
//           )}
//         </div>
//       )}
//       <div
//         className={cn(
//           "rounded-2xl px-4 py-3 max-w-[85%] shadow-sm space-y-2",
//           message.role === "user"
//             ? "bg-primary text-primary-foreground rounded-tr-sm"
//             : message.role === "system"
//               ? "bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 text-yellow-900 dark:text-yellow-100"
//               : "bg-muted rounded-tl-sm",
//         )}
//       >
//         <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">
//           {message.content}
//         </p>
//         {message.sql && (
//           <div className="bg-background/60 rounded-lg p-3 border">
//             <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
//               <Code className="h-3 w-3" /> Generated SQL
//             </div>
//             <pre className="text-xs font-mono whitespace-pre-wrap break-all">
//               {message.sql}
//             </pre>
//           </div>
//         )}
//         <p className="text-xs opacity-50">
//           {new Date(message.timestamp).toLocaleTimeString([], {
//             hour: "2-digit",
//             minute: "2-digit",
//           })}
//         </p>
//       </div>
//       {message.role === "user" && (
//         <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 mt-1">
//           <User className="h-4 w-4 text-primary-foreground" />
//         </div>
//       )}
//     </div>
//   );
// }
