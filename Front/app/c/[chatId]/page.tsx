"use client"

import { redirect } from 'next/navigation'
import Home from '@/app/page'

// This component handles the /c/[chatId] route
export default function ChatPage() {
  // The main page.tsx will handle the routing logic
  return <Home />
}