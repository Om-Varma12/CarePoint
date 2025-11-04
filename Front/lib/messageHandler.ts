import type { Message, Chat } from '@/types/chat'

export function generateChatHash(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let hash = ''
  for (let i = 0; i < 10; i++) {
    hash += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return hash
}

interface CreateConversationParams {
  userId: number
  content: string
  currentChatId: string | null
  conversationsInDB: Set<string>
  setCurrentChatId: (id: string) => void
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>
  router: any
}

export async function ensureConversationExists(params: CreateConversationParams): Promise<string> {
  const { userId, content, currentChatId, conversationsInDB, setCurrentChatId, setChats, router } = params
  
  const needsNewConversation = !currentChatId || !conversationsInDB.has(currentChatId)
  
  if (!needsNewConversation) {
    console.log('\n📌 Using EXISTING conversation:', currentChatId)
    return currentChatId as string
  }

  console.log('\n📌 STEP 1: Creating NEW conversation')
  const newId = generateChatHash()
  console.log('🔑 Generated hash:', newId)
  
  const createResponse = await fetch('http://localhost:5000/createConversation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_hash: newId,
      user_id: userId,
      title: content.slice(0, 50)
    })
  })
  
  const createData = await createResponse.json()
  console.log('🔥 Create response:', createData)
  
  if (!createData.success) {
    throw new Error(createData.error || 'Failed to create conversation')
  }
  
  conversationsInDB.add(newId)
  setCurrentChatId(newId)
  router.push(`/c/${newId}`)
  
  const newChat: Chat = {
    id: newId,
    title: content.slice(0, 50),
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  
  setChats(prev => [newChat, ...prev])
  console.log('✅ Conversation created and added locally:', newId)
  
  return newId
}

export async function saveUserMessage(conversationHash: string, content: string): Promise<void> {
  console.log('\n📌 STEP 4: Saving user message to database')
  
  const response = await fetch('http://localhost:5000/addMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      conversation_hash: conversationHash,
      sender: 'user',
      message: content
    })
  })
  
  const data = await response.json()
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to save message')
  }
  
  console.log('✅ User message saved!')
}

interface HandleAIResponseParams {
  chatId: string
  removeLoadingMessage: (chatId: string) => void
  addBotMessage: (chatId: string, message: Message) => void
}

export async function handleAIResponse(params: HandleAIResponseParams): Promise<void> {
  const { chatId, removeLoadingMessage, addBotMessage } = params
  
  console.log('🤖 Calling AI endpoint for chat:', chatId)
  
  try {
    const aiResponse = await fetch('http://localhost:5000/getAIResponse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversation_hash: chatId })
    })
    
    const aiData = await aiResponse.json()
    removeLoadingMessage(chatId)
    
    if (aiData.success && aiData.response) {
      console.log('✅ AI Response received:', aiData.response.substring(0, 100) + '...')
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "bot",
        content: aiData.response,
        timestamp: new Date(),
      }
      
      console.log('📌 Adding AI response to UI')
      addBotMessage(chatId, botMessage)
      console.log('✅ AI response added to chat!')
    } else {
      console.error('❌ AI Response failed:', aiData.error)
      addFallbackMessage(chatId, addBotMessage)
    }
  } catch (error) {
    console.error('❌ Error calling AI endpoint:', error)
    removeLoadingMessage(chatId)
    addFallbackMessage(chatId, addBotMessage)
  }
  
  console.log('🏁 ===== COMPLETE =====\n')
}

function addFallbackMessage(chatId: string, addBotMessage: (chatId: string, message: Message) => void): void {
  const fallbackMessage: Message = {
    id: (Date.now() + 1).toString(),
    role: "bot",
    content: "I apologize, but I'm having trouble generating a response right now. Please try again.",
    timestamp: new Date(),
  }
  addBotMessage(chatId, fallbackMessage)
}