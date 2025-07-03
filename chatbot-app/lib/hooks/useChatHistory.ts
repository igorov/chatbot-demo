"use client"

import { useState, useEffect, useCallback } from 'react';
import { Message } from 'ai/react';
import { fetchChatHistory, sendChatMessage, ChatHistoryResponse } from '../services/chatService';

export function useChatHistory(username: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [historyMessages, setHistoryMessages] = useState<Message[]>([]);

  /**
   * Converts API message format to the format expected by useChat
   */
  const formatHistoryMessages = (data: ChatHistoryResponse): Message[] => {
    if (!data.messages || !Array.isArray(data.messages)) {
      return [];
    }

    return data.messages.map((msg, index) => ({
      id: `history-${index}`,
      role: msg.role === 'human' ? 'user' : 'assistant',
      content: msg.content,
      createdAt: new Date()
    }));
  };

  /**
   * Loads chat history from the API
   */
  const loadChatHistory = useCallback(async () => {
    if (!username) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchChatHistory(username);
      setHistoryMessages(formatHistoryMessages(data));
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      console.error('Failed to fetch chat history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  // Load chat history on component mount or when user changes
  useEffect(() => {
    if (username) {
      // Reset state when username changes
      setHistoryMessages([]);
      loadChatHistory();
    } else {
      // Clear messages when user logs out
      setHistoryMessages([]);
    }
  }, [username, loadChatHistory]);

  /**
   * Sends a message to the chatbot API and updates the local message history
   */
  const sendMessage = useCallback(async (content: string) => {
    if (!username || !content.trim()) return null;
    
    setIsSending(true);
    setError(null);
    
    try {
      // Add user message to history immediately
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: content,
        createdAt: new Date()
      };
      
      setHistoryMessages(prev => [...prev, userMessage]);
      
      // Send message to API
      const response = await sendChatMessage(content, username);
      
      // Create AI message from response
      const aiMessage: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        createdAt: new Date(response.processed_timestamp || Date.now())
      };
      
      // Add AI response to history
      setHistoryMessages(prev => [...prev, aiMessage]);
      
      return aiMessage;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
      console.error('Failed to send message:', err);
      return null;
    } finally {
      setIsSending(false);
    }
  }, [username]);

  return {
    isLoading,
    isSending,
    error,
    historyMessages,
    loadChatHistory,
    sendMessage
  };
}
