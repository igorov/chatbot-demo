"use client"

import { useState, useEffect } from "react"
import LoginForm from "@/components/login-form"
import ChatInterface from "@/components/chat-interface"
import { useChat } from "@/lib/contexts/ChatContext"

export default function Home() {
  const { username, setUsername } = useChat()
  const [isLoading, setIsLoading] = useState(true)
  
  // Set loading to false after component mounts
  useEffect(() => {
    setIsLoading(false)
  }, [])

  const handleLogin = (username: string) => {
    setUsername(username)
  }

  const handleLogout = () => {
    setUsername(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800">
      {!username ? <LoginForm onLogin={handleLogin} /> : <ChatInterface user={username} onLogout={handleLogout} />}
    </div>
  )
}
