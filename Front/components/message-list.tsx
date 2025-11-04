import type { Message } from "@/types/chat"
import { MessageBubble } from "@/components/message-bubble"

interface MessageListProps {
  messages: Message[]
}

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="w-full max-w-[1000px] mx-auto px-6 py-6 space-y-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
    </div>
  )
}