"use client"

import type React from "react"

import { useState, useRef, useEffect, FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Send, User, Bot, LogOut, Minimize2, Maximize2, RefreshCcw, Brain } from "lucide-react"
import { useChat as useGlobalChat } from "@/lib/contexts/ChatContext"
import { useUserMemory } from "@/lib/hooks/useUserMemory"
import ReactMarkdown from "react-markdown"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"

// Estilos para el contenedor de markdown
const markdownContainerStyles = "prose prose-invert max-w-none prose-p:my-1 prose-headings:mt-3 prose-headings:mb-2 prose-h1:text-xl prose-h2:text-lg prose-h3:text-md prose-a:text-yellow-400 prose-a:font-medium prose-a:underline prose-a:decoration-yellow-500 prose-a:underline-offset-2 prose-a:hover:text-yellow-300 prose-a:hover:decoration-yellow-300 prose-code:bg-black/20 prose-code:rounded prose-code:px-1 prose-code:py-0.5 prose-pre:bg-black/30 prose-pre:p-2 prose-pre:rounded prose-blockquote:border-l-4 prose-blockquote:border-gray-400 prose-blockquote:pl-3 prose-blockquote:italic"

interface ChatInterfaceProps {
  user: string
  onLogout: () => void
}

export default function ChatInterface({ user, onLogout }: ChatInterfaceProps) {
  // Get chat state from context
  const { 
    messages, 
    isHistoryLoading, 
    isMessageSending,
    refreshHistory, 
    sendMessage 
  } = useGlobalChat()
  
  // Local state for input management
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };
  
  // Handle form submission
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!input.trim()) return;
    
    setIsLoading(true);
    
    try {
      // Send message to our API
      await sendMessage(input);
      setInput(''); // Clear input after sending
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };
  
  const [isMinimized, setIsMinimized] = useState(false)
  const [isMemoryOpen, setIsMemoryOpen] = useState(false)
  
  // Usar el hook personalizado para la memoria del usuario
  const { memory: userMemory, isLoading: isMemoryLoading, fetchUserMemory } = useUserMemory(user)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleOpenMemory = () => {
    setIsMemoryOpen(true)
    fetchUserMemory()
  }

  return (
    <div className="h-screen p-4 flex flex-col overflow-hidden">
      <div className="max-w-4xl w-full mx-auto flex flex-col h-full overflow-hidden">
        {/* Header */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-lg mb-4 flex-shrink-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white text-lg">Chat Bot Assistant</CardTitle>
                  <p className="text-gray-300 text-sm">Conectado como: {user}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshHistory}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                  disabled={isHistoryLoading}
                  title="Recargar historial"
                >
                  <RefreshCcw className={`w-4 h-4 ${isHistoryLoading ? 'animate-spin' : ''}`} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenMemory}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                  title="Ver memoria del usuario"
                >
                  <Brain className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  className="text-gray-300 hover:text-white hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Chat Container */}
        {!isMinimized && (
          <Card className="flex-1 bg-white/10 backdrop-blur-lg border-white/20 shadow-lg flex flex-col overflow-hidden">
            {/* Messages Area */}
            <CardContent className="h-full p-6 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {isHistoryLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <RefreshCcw className="w-12 h-12 mx-auto mb-4 opacity-50 animate-spin" />
                      <p className="text-lg">Cargando historial...</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-400">
                      <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg">¡Hola {user}!</p>
                      <p className="text-sm">Escribe un mensaje para comenzar la conversación</p>
                    </div>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start space-x-3 ${
                        message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === "user"
                            ? "bg-gradient-to-r from-blue-500 to-cyan-400"
                            : "bg-gradient-to-r from-slate-600 to-slate-500"
                        }`}
                      >
                        {message.role === "user" ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-white" />
                        )}
                      </div>
                      {message.role === "user" ? (
                        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white p-3 rounded-lg">
                          {message.content}
                        </div>
                      ) : (
                        <div className="bg-white/10 text-white p-3 rounded-lg">
                          <div className={markdownContainerStyles}>
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {isLoading && (
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-600 to-slate-500 flex items-center justify-center">
                            <Bot className="w-4 h-4 text-white" />
                          </div>
                          <div className="bg-white/20 text-gray-100 border border-white/10 p-3 rounded-lg">
                            <div className="flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.1s" }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  ))
                )}
                {isLoading && (
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-slate-600 to-slate-500 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white/20 text-gray-100 border border-white/10 p-3 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="mt-4 pt-4 border-t border-white/10 flex-shrink-0">
                <form onSubmit={handleSubmit} className="flex space-x-3">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Escribe tu mensaje..."
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-cyan-400 focus:ring-cyan-400"
                    disabled={isLoading || isMessageSending}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || isMessageSending || !input.trim()}
                    className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-6"
                  >
                    {isMessageSending ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Memory Dialog Modal */}
      <Dialog open={isMemoryOpen} onOpenChange={setIsMemoryOpen}>
        <DialogContent className="bg-gray-900/95 border-white/20 text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-cyan-400 mb-2">
              Memoria del Usuario: {user}
            </DialogTitle>
          </DialogHeader>
          
          {isMemoryLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-300">Cargando memoria...</span>
            </div>
          ) : (
            <div className="mt-2 p-4 bg-black/40 rounded-lg border border-white/10">
              <div className={markdownContainerStyles}>
                <ReactMarkdown>
                  {userMemory}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
