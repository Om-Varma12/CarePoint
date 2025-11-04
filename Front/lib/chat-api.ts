import type { Chat, Message } from "@/types/chat"

const API_BASE_URL = "http://localhost:5000"

// Save a new chat to the database
export async function saveChat(chat: Chat, userEmail?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/saveChat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatHash: chat.id,
        title: chat.title,
        messages: chat.messages,
        userEmail: userEmail,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Error saving chat:", error)
    return false
  }
}

// Update an existing chat in the database
export async function updateChat(chat: Chat, userEmail?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/updateChat`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatHash: chat.id,
        title: chat.title,
        messages: chat.messages,
        userEmail: userEmail,
        updatedAt: chat.updatedAt,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Error updating chat:", error)
    return false
  }
}

// Load a specific chat by hash
export async function loadChatByHash(chatHash: string, userEmail?: string): Promise<Chat | null> {
  try {
    const url = new URL(`${API_BASE_URL}/getChat`)
    url.searchParams.append("chatHash", chatHash)
    if (userEmail) {
      url.searchParams.append("userEmail", userEmail)
    }

    const response = await fetch(url.toString())

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    
    // Convert date strings back to Date objects
    return {
      ...data,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt),
      messages: data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }
  } catch (error) {
    console.error("Error loading chat:", error)
    return null
  }
}

// Load all chats for a user
export async function loadUserChats(userEmail: string): Promise<Chat[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/getUserChats?userEmail=${userEmail}`)

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    
    // Convert date strings back to Date objects
    return data.map((chat: any) => ({
      ...chat,
      createdAt: new Date(chat.createdAt),
      updatedAt: new Date(chat.updatedAt),
      messages: chat.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
    }))
  } catch (error) {
    console.error("Error loading user chats:", error)
    return []
  }
}

// Delete a chat
export async function deleteChat(chatHash: string, userEmail?: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/deleteChat`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatHash,
        userEmail,
      }),
    })

    return response.ok
  } catch (error) {
    console.error("Error deleting chat:", error)
    return false
  }
}