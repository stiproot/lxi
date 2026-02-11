import { useEffect, useState } from 'react';
import { useChatContext } from '../contexts/ChatContext';
import { useTypewriter } from './useTypingEffect';

interface UseMessageTypingProps {
  content: string;
  isNewMessage: boolean;
  isSender: 'ai' | 'user' | 'other';
  messageId: string;
  messageTimestamp: string;
  onProgress?: () => void;
}

export const useMessageTyping = ({
  content,
  isNewMessage,
  isSender,
  messageId: _messageId,
  messageTimestamp: _messageTimestamp,
  onProgress,
}: UseMessageTypingProps) => {
  const { startTyping, stopTyping, skipTypingTimestamp, currentChatId, shouldMessageHaveTyping } =
    useChatContext();
  const [isTyped, setIsTyped] = useState(isSender !== 'ai' || !isNewMessage);
  const [lastSkipTimestamp, setLastSkipTimestamp] = useState(skipTypingTimestamp);
  const [lastChatId, setLastChatId] = useState(currentChatId);

  // Check if this specific message should have typing animation
  const shouldTypeThisMessage =
    isSender === 'ai' && isNewMessage && content && shouldMessageHaveTyping(_messageId);

  // Reset typing state when switching chats or when message shouldn't be typed
  useEffect(() => {
    if (currentChatId !== lastChatId) {
      // When switching chats, mark messages as typed immediately (no animation)
      setIsTyped(true);
      setLastChatId(currentChatId);
      if (isSender === 'ai') {
        stopTyping();
      }
    } else if (!shouldTypeThisMessage && isSender === 'ai') {
      // If this AI message shouldn't be typed, mark it as typed
      setIsTyped(true);
    }
  }, [currentChatId, lastChatId, isSender, shouldTypeThisMessage, stopTyping]);

  const typedText = useTypewriter(
    content,
    content.length > 1000 ? 3 : content.length > 500 ? 5 : 8,
    'word',
    isTyped // Use isTyped state to control when typing should happen
  );

  useEffect(() => {
    // Only start typing if this message should be typed and isn't already typed
    if (!isTyped && shouldTypeThisMessage) {
      console.log(
        `Starting typing animation for AI message in chat ${currentChatId}: ${content.substring(0, 50)}...`
      );
      startTyping();
    }

    const isTypingComplete = typedText === content && !isTyped && content;

    if (isTypingComplete) {
      console.log('Typing animation complete');
      setIsTyped(true);
      stopTyping();
    }

    // Only call onProgress if we're actively typing
    if (!isTyped && shouldTypeThisMessage && content) {
      onProgress?.();
    }
  }, [
    isTyped,
    typedText,
    content,
    shouldTypeThisMessage,
    onProgress,
    startTyping,
    stopTyping,
    currentChatId,
  ]);

  // Add effect to handle skip typing
  useEffect(() => {
    if (skipTypingTimestamp > lastSkipTimestamp && !isTyped && isSender === 'ai') {
      console.log('Skipping typing animation');
      setIsTyped(true);
      stopTyping();
      setLastSkipTimestamp(skipTypingTimestamp);
    }
  }, [skipTypingTimestamp, lastSkipTimestamp, isTyped, isSender, stopTyping]);

  return {
    typedText,
    isTyped,
  };
};
