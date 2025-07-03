/**
 * Service for handling chat-related API calls
 */

export interface ChatHistoryMessage {
  role: 'human' | 'ai';
  content: string;
}

export interface ChatHistoryResponse {
  user: string;
  messages: ChatHistoryMessage[];
}

export interface ChatMessageRequest {
  question: string;
  user: string;
}

export interface ChatMessageResponse {
  answer: string;
  user: string;
  thread_id: string;
  processed_timestamp: string;
}

export interface UserMemoryResponse {
  user: string;
  memory: string;
}

// Usar variable de entorno o valor por defecto si no está definida
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Fetches chat history for a specific user
 */
export async function fetchChatHistory(username: string): Promise<ChatHistoryResponse> {
  const response = await fetch(`${API_BASE_URL}/chatbot/history?user=${username}`);
  
  if (!response.ok) {
    throw new Error(`Error fetching chat history: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Sends a message to the chatbot and returns the response
 */
export async function sendChatMessage(question: string, username: string): Promise<ChatMessageResponse> {
  const response = await fetch(`${API_BASE_URL}/chatbot`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      question,
      user: username,
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Error sending message: ${response.status}`);
  }
  
  return await response.json();
}

/**
 * Fetches user memory information
 */
export async function getUserMemory(username: string): Promise<UserMemoryResponse> {
  const response = await fetch(`${API_BASE_URL}/chatbot/memory?user=${username}`);
  
  if (!response.ok) {
    throw new Error(`Error fetching user memory: ${response.status}`);
  }
  
  return await response.json();
}
