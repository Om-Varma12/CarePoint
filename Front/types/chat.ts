export interface Message {
  id: string
  role: "user" | "bot"
  content: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface Chat {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}
