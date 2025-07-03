"use client"

import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { Message } from 'ai/react';
import { useChatHistory } from '../hooks/useChatHistory';

interface ChatContextType {
  username: string | null;
  messages: Message[];
  isHistoryLoading: boolean;
  isMessageSending: boolean;
  historyError: Error | null;
  refreshHistory: () => Promise<void>;
  sendMessage: (content: string) => Promise<Message | null>;
  setUsername: (username: string | null) => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
}

// Create the chat context
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider component
export function ChatProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const { 
    isLoading: isHistoryLoading, 
    isSending: isMessageSending,
    error: historyError, 
    historyMessages, 
    loadChatHistory,
    sendMessage 
  } = useChatHistory(username);
  
  // Update messages when history is loaded
  useEffect(() => {
    if (historyMessages.length > 0) {
      setMessages(historyMessages);
    }
  }, [historyMessages]);

  // Load username from localStorage on mount
  useEffect(() => {
    const savedUsername = localStorage.getItem('user');
    if (savedUsername) {
      setUsername(savedUsername);
    }
  }, []);

  // Value object passed to context consumers
  const contextValue: ChatContextType = {
    username,
    messages,
    isHistoryLoading,
    isMessageSending,
    historyError,
    refreshHistory: loadChatHistory,
    sendMessage,
    setUsername: (newUsername: string | null) => {
      // Clear messages when username changes
      setMessages([]);
      
      if (newUsername) {
        localStorage.setItem('user', newUsername);
      } else {
        localStorage.removeItem('user');
      }
      setUsername(newUsername);
    },
    setMessages
  };
  
  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook to use the chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
