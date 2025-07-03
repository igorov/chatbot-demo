"use client"

import { useState, useCallback } from 'react';
import { getUserMemory } from '../services/chatService';

export function useUserMemory(username: string | null) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [memory, setMemory] = useState<string>('');

  /**
   * Fetches user memory information from the API
   */
  const fetchUserMemory = useCallback(async () => {
    if (!username) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getUserMemory(username);
      setMemory(data.memory);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Error al obtener la memoria del usuario'));
      console.error('Error fetching user memory:', err);
      setMemory('No se pudo cargar la memoria del usuario');
    } finally {
      setIsLoading(false);
    }
  }, [username]);

  return {
    isLoading,
    error,
    memory,
    fetchUserMemory
  };
}
