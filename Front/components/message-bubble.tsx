import type { Message } from "@/types/chat"
import { Heart } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={cn("flex gap-3 w-full", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
          <Heart className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      <div className={cn("flex flex-col", isUser ? "items-end" : "items-start", "max-w-[70%]")}>
        <div
          className={cn(
            "px-4 py-3 text-[15px] leading-relaxed shadow-sm break-words w-full",
            isUser
              ? "bg-primary text-primary-foreground rounded-[18px_18px_4px_18px]"
              : "bg-muted text-foreground rounded-[18px_18px_18px_4px]",
          )}
        >
          {message.content}
        </div>
        <span className="text-xs text-muted-foreground mt-1">{format(message.timestamp, "h:mm a")}</span>
      </div>
    </div>
  )
}