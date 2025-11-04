"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatInterface } from "@/components/chat-interface"
import type { Message } from "@/types/chat"
import { getUserFromCookie } from "@/lib/auth-utils"
import { useConversations } from "@/hooks/useConversations"
import { ensureConversationExists, saveUserMessage, handleAIResponse } from "@/lib/messageHandler"

export default function Home() {
  const router = useRouter()
  const pathname = usePathname()
  const [currentChatId, setCurrentChatId] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userId, setUserId] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isClient, setIsClient] = useState(false)
  
  const {
    chats,
    setChats,
    conversationsInDB,
    addMessageToChat,
    removeLoadingMessage,
    loadChatFromBackend,
    loadUserConversations,
    deleteChat,
  } = useConversations()

  // Set client-side flag
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Load user from cookie on mount
  useEffect(() => {
    if (!isClient) return
    
    const savedUser = getUserFromCookie()
    if (savedUser) {
      setUserId(savedUser.userId)
      console.log('👤 User loaded from cookie:', savedUser.userName)
      loadUserConversations(savedUser.userId)
    }
  }, [loadUserConversations, isClient])

  // Extract chat ID from URL
  useEffect(() => {
    if (!isClient) return
    
    const match = pathname.match(/\/c\/([a-zA-Z0-9]+)/)
    if (match) {
      const chatIdFromUrl = match[1]
      console.log('🔗 URL chat ID:', chatIdFromUrl)
      setCurrentChatId(chatIdFromUrl)
      
      const chatExists = chats.some(chat => chat.id === chatIdFromUrl)
      
      if (!chatExists && userId) {
        console.log('⚠️ Chat not in state, loading from backend')
        loadChatFromBackend(chatIdFromUrl)
      }
    } else {
      console.log('🏠 On home page, clearing current chat')
      setCurrentChatId(null)
    }
  }, [pathname, userId, chats, loadChatFromBackend, isClient])

  const currentChat = chats.find((chat) => chat.id === currentChatId)

  const handleNewChat = () => {
    console.log('➕ New Chat button clicked - navigating to home')
    setCurrentChatId(null)
    setSidebarOpen(false)
    router.push('/')
  }

  const handleSelectChat = (chatId: string) => {
    console.log('📂 Selecting chat:', chatId)
    setCurrentChatId(chatId)
    setSidebarOpen(false)
    router.push(`/c/${chatId}`)
  }

  const handleDeleteChat = async (chatId: string) => {
    try {
      await deleteChat(chatId)
      
      if (currentChatId === chatId) {
        setCurrentChatId(null)
        router.push('/')
      }
    } catch (error) {
      console.error('❌ Error deleting chat:', error)
    }
  }

  const addBotMessageToChat = (chatId: string, botMessage: Message) => {
    console.log('✅ Adding bot message to chat:', chatId)
    addMessageToChat(chatId, botMessage)
  }

  // MAIN MESSAGE HANDLER
  const handleSendMessage = async (content: string) => {
    console.log('\n🚀 ===== STARTING MESSAGE SEND =====')
    console.log('📝 Message:', content.substring(0, 50) + '...')
    console.log('👤 User ID:', userId)
    console.log('💬 Current Chat ID:', currentChatId)
    
    if (!userId) {
      alert("Please login to send messages")
      return
    }

    if (isProcessing) {
      console.log('⏳ Already processing, please wait...')
      return
    }

    const currentChat = chats.find((chat) => chat.id === currentChatId)
    if (currentChat && currentChat.messages.length >= 20) {
      alert("This conversation has reached the 20-message limit. Please start a new conversation to continue chatting.")
      return
    }

    setIsProcessing(true)

    try {
      const activeChatId = await ensureConversationExists({
        userId,
        content,
        currentChatId,
        conversationsInDB: conversationsInDB.current,
        setCurrentChatId,
        setChats,
        router,
      })

      console.log('\n📌 STEP 2: Creating user message')
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date(),
      }
      
      console.log('📌 STEP 3: Adding user message to UI')
      addMessageToChat(activeChatId, userMessage)

      await saveUserMessage(activeChatId, content)

      console.log('\n📌 STEP 5: Adding loading indicator')
      const loadingMessage: Message = {
        id: 'loading-' + Date.now(),
        role: "bot",
        content: "...",
        timestamp: new Date(),
      }
      addMessageToChat(activeChatId, loadingMessage)

      console.log('\n📌 STEP 6: Getting AI response from backend')
      
      setTimeout(() => {
        handleAIResponse({
          chatId: activeChatId,
          removeLoadingMessage,
          addBotMessage: addBotMessageToChat,
        })
      }, 500)

    } catch (error) {
      console.error('❌ ERROR:', error)
      alert('An error occurred. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isClient) {
    return (
      <div className="flex h-screen overflow-hidden bg-background">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <ChatSidebar
        chats={chats}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <ChatInterface
        chat={currentChat}
        onSendMessage={handleSendMessage}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        onNewChat={handleNewChat}
        onUserIdChange={setUserId}
      />
    </div>
  )
}