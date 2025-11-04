"use client"

import type { Chat } from "@/types/chat"
import { Button } from "@/components/ui/button"
import { Heart, Plus, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { useState, useEffect } from "react"

interface ChatSidebarProps {
  chats: Chat[]
  currentChatId: string | null
  onNewChat: () => void
  onSelectChat: (chatId: string) => void
  onDeleteChat: (chatId: string) => void
  isOpen: boolean
  onClose: () => void
}

export function ChatSidebar({
  chats,
  currentChatId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
  isOpen,
  onClose,
}: ChatSidebarProps) {
  const [groupedChats, setGroupedChats] = useState<Record<string, Chat[]>>({})
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setGroupedChats(groupChatsByDate(chats))
  }, [chats])

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:relative inset-y-0 left-0 z-50 w-[280px] bg-sidebar border-r border-sidebar-border flex flex-col transition-transform duration-300 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex flex-col items-center justify-center mb-5">
            <Heart className="w-8 h-8 text-primary mb-2" />
            <h1 className="text-2xl font-bold text-primary">CarePoint</h1>
          </div>

          <Button variant="ghost" size="icon" className="lg:hidden absolute top-5 right-5" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>

          <Button onClick={onNewChat} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="w-4 h-4 mr-2" />
            New Conversation
          </Button>
        </div>

        {/* Chat history */}
        <div className="flex-1 overflow-y-auto">
          {isClient && Object.entries(groupedChats).map(([group, groupChats]) => (
            <div key={group} className="mb-4">
              <h3 className="px-4 py-2 text-xs font-semibold uppercase text-muted-foreground">{group}</h3>
              <div className="px-3 space-y-1">
                {groupChats.map((chat) => (
                  <ChatItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === currentChatId}
                    onSelect={() => onSelectChat(chat.id)}
                    onDelete={() => onDeleteChat(chat.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </aside>
    </>
  )
}

interface ChatItemProps {
  chat: Chat
  isActive: boolean
  onSelect: () => void
  onDelete: () => void
}

function ChatItem({ chat, isActive, onSelect, onDelete }: ChatItemProps) {
  const [timeAgo, setTimeAgo] = useState("")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setTimeAgo(formatDistanceToNow(chat.updatedAt, { addSuffix: true }))
  }, [chat.updatedAt])

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors",
        isActive ? "bg-sidebar-accent border-l-3 border-l-primary" : "hover:bg-sidebar-accent/50",
      )}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-sidebar-foreground truncate">{chat.title}</p>
        <p className="text-xs text-muted-foreground">
          {isClient ? timeAgo : "Loading..."}
        </p>
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-muted-foreground hover:text-destructive"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

function groupChatsByDate(chats: Chat[]) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const lastWeek = new Date(today)
  lastWeek.setDate(lastWeek.getDate() - 7)
  const lastMonth = new Date(today)
  lastMonth.setDate(lastMonth.getDate() - 30)

  const groups: Record<string, Chat[]> = {
    Today: [],
    Yesterday: [],
    "Last 7 days": [],
    "Last 30 days": [],
    Older: [],
  }

  chats.forEach((chat) => {
    const chatDate = new Date(chat.updatedAt)
    if (chatDate >= today) {
      groups.Today.push(chat)
    } else if (chatDate >= yesterday) {
      groups.Yesterday.push(chat)
    } else if (chatDate >= lastWeek) {
      groups["Last 7 days"].push(chat)
    } else if (chatDate >= lastMonth) {
      groups["Last 30 days"].push(chat)
    } else {
      groups.Older.push(chat)
    }
  })

  // Remove empty groups
  Object.keys(groups).forEach((key) => {
    if (groups[key].length === 0) {
      delete groups[key]
    }
  })

  return groups
}