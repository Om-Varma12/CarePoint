import { useState, useRef, useCallback } from "react";
import type { Chat, Message } from "@/types/chat";

export function useConversations() {
  const [chats, setChats] = useState<Chat[]>([]);
  const conversationsInDB = useRef<Set<string>>(new Set());

  const mapApiMessagesToState = (apiMessages: any[]): Message[] => {
    return apiMessages.map((msg: any) => ({
      id: msg.message_id.toString(),
      role: msg.sender as "user" | "bot",
      content: msg.message,
      timestamp: new Date(msg.timestamp),
    }));
  };

  const upsertChatIfMissing = useCallback((chat: Chat) => {
    setChats((prev) =>
      prev.find((c) => c.id === chat.id) ? prev : [chat, ...prev]
    );
  }, []);

  const updateChatById = useCallback(
    (chatId: string, updater: (chat: Chat) => Chat) => {
      setChats((prevChats) =>
        prevChats.map((chat) => (chat.id === chatId ? updater(chat) : chat))
      );
    },
    []
  );

  const addMessageToChat = useCallback(
    (chatId: string, message: Message) => {
      updateChatById(chatId, (chat) => ({
        ...chat,
        messages: [...chat.messages, message],
        updatedAt: new Date(),
      }));
    },
    [updateChatById]
  );

  const removeLoadingMessage = useCallback(
    (chatId: string) => {
      updateChatById(chatId, (chat) => ({
        ...chat,
        messages: chat.messages.filter((msg) => !msg.id.startsWith("loading-")),
      }));
    },
    [updateChatById]
  );

  const loadChatFromBackend = useCallback(
    async (chatHash: string) => {
      try {
        console.log("🔥 Loading chat from backend:", chatHash);
        const response = await fetch(
          `http://localhost:5000/getConversation/${chatHash}`
        );
        const data = await response.json();

        if (data.success && data.messages) {
          conversationsInDB.current.add(chatHash);

          const messages = mapApiMessagesToState(data.messages);
          const lastMessageTime =
            messages.length > 0
              ? messages[messages.length - 1].timestamp
              : new Date();

          const newChat: Chat = {
            id: chatHash,
            title:
              messages.length > 0
                ? messages[0].content.slice(0, 50)
                : "New Conversation",
            messages,
            createdAt: messages.length > 0 ? messages[0].timestamp : new Date(),
            updatedAt: lastMessageTime,
          };

          upsertChatIfMissing(newChat);
          console.log("✅ Chat loaded successfully");
        }
      } catch (error) {
        console.error("❌ Error loading chat:", error);
      }
    },
    [upsertChatIfMissing]
  );

  const loadUserConversations = useCallback(async (uid: number) => {
    try {
      console.log("📚 Loading conversations for user:", uid);
      const response = await fetch(
        `http://localhost:5000/getUserConversations/${uid}`
      );
      const data = await response.json();

      if (!data.success || !data.conversations) return;

      console.log("✅ Found", data.conversations.length, "conversations");

      data.conversations.forEach((conv: any) => {
        conversationsInDB.current.add(conv.conversation_id);
      });

      const chatsPromises = data.conversations.map(async (conv: any) => {
        const messagesResponse = await fetch(
          `http://localhost:5000/getConversation/${conv.conversation_id}`
        );
        const messagesData = await messagesResponse.json();

        if (messagesData.success && messagesData.messages) {
          const messages = mapApiMessagesToState(messagesData.messages);
          const lastMessageTime =
            messages.length > 0
              ? messages[messages.length - 1].timestamp
              : new Date(conv.started_at);

          const updatedTime =
            conv.ended_at && conv.ended_at !== null
              ? new Date(conv.ended_at)
              : lastMessageTime;

          return {
            id: conv.conversation_id,
            title: conv.title,
            messages,
            createdAt: new Date(conv.started_at),
            updatedAt: updatedTime,
          };
        }
        return null;
      });

      const loadedChats = (await Promise.all(chatsPromises)).filter(
        Boolean
      ) as Chat[];
      setChats(loadedChats);
      console.log("✅ Loaded", loadedChats.length, "chats into state");
    } catch (error) {
      console.error("❌ Error loading user conversations:", error);
    }
  }, []);

  const deleteChat = useCallback(async (chatId: string) => {
    await fetch("http://localhost:5000/endConversation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_hash: chatId }),
    });

    conversationsInDB.current.delete(chatId);
    setChats((chats) => chats.filter((chat) => chat.id !== chatId));
  }, []);

  return {
    chats,
    setChats,
    conversationsInDB,
    addMessageToChat,
    removeLoadingMessage,
    loadChatFromBackend,
    loadUserConversations,
    deleteChat,
  };
}
