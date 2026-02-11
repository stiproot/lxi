import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '@/types';
import { useChatContext } from '../contexts/ChatContext';
import { queryAiAgent } from '../services/api';
import { handleError } from '../utils/errorHandler';

export const useAiAssistant = () => {
  const [loading, setLoading] = useState(false);
  const { stopTyping, addMessage } = useChatContext();
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  const generateChatName = (messages: string[], currentChatName: string): string | null => {
    // Only rename if it's still the default name pattern
    const defaultNamePattern = /^Chat \d+$/;
    if (defaultNamePattern.test(currentChatName) && messages.length > 0) {
      // Only use user messages for naming, not system messages
      const userMessages = messages.filter((msg) => !msg.startsWith('Repository changed to:'));
      return userMessages[0] || null; // Return null if no user messages found
    }
    return null; // Don't rename if it's not a default name
  };

  const sendMessage = useCallback(async (message: string, repo: string, chatId: string) => {
    setLoading(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const response = await queryAiAgent(message, repo, chatId, { signal: controller.signal });

      if (response?.output) {
        const aiResponseMessage: ChatMessage = {
          id: uuidv4(),
          chatId,
          sender: 'ai',
          content: response.output,
          timestamp: new Date().toISOString(),
          type: 'ai' as const,
        };

        await addMessage(aiResponseMessage);
        return response.output;
      }
      return null;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        handleError(new Error('The request was aborted'), 'Error');
      } else {
        console.error('Fetch error:', error);
        handleError(new Error(error.message || 'Unknown error'), 'Error fetching AI response');
      }
      return null;
    } finally {
      setLoading(false);
      setAbortController(null);
    }
  }, []);

  const stopMessage = useCallback(() => {
    if (abortController) {
      abortController.abort();
      stopTyping();
    }
  }, [abortController, stopTyping]);

  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  return { sendMessage, loading, stopMessage, generateChatName };
};
