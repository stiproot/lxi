import React, { useEffect, useMemo, useRef, useState } from 'react';
import { IconArrowDown } from '@tabler/icons-react';
import { ActionIcon, Center, ScrollArea, useMantineColorScheme } from '@mantine/core';
import { ChatMessage } from '@/types';
import { useChatContext } from '../../contexts/ChatContext';
import { useUserContext } from '../../contexts/UserContext';
import DateSeparator from '../DateSeparator/DateSeparator';
import Message from '../Message/Message';
import styles from './MessageList.module.css';

// Remove the RepoChangeSeparator component as we now handle this in Message component

const MessageList = ({ isSending }: { isSending: boolean }) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const {
    chatMessages,
    loadingMessages,
    isAiTyping,
    currentChatId,
    aiResponse,
    setAiResponse,
    isActivelyTyping,
    aiTypingInChats,
  } = useChatContext();
  const { user } = useUserContext();
  const [prevMessagesLength, setPrevMessagesLength] = useState(chatMessages.length);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollToBottomButton, setShowScrollToBottomButton] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);

  // Save scroll position to local storage before the page unloads
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (viewportRef.current) {
        localStorage.setItem('chatScrollPosition', viewportRef.current.scrollTop.toString());
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Restore scroll position on initial load
  useEffect(() => {
    const savedScrollPosition = localStorage.getItem('chatScrollPosition');
    if (savedScrollPosition && viewportRef.current) {
      viewportRef.current.scrollTop = parseInt(savedScrollPosition, 10);
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    if (isAtBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isSending, isAiTyping, isAtBottom]);

  useEffect(() => {
    setPrevMessagesLength(chatMessages.length);
  }, [chatMessages.length]);

  const handleScroll = () => {
    if (viewportRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight;
      setIsAtBottom(isAtBottom);
      setShowScrollToBottomButton(!isAtBottom && scrollTop + clientHeight < scrollHeight - 200); // Show button when scrolled up more than 200px
      setIsUserScrolling(true);
    }
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      setShowScrollToBottomButton(false);
      setIsAtBottom(true);
      setIsUserScrolling(false);
    }
  };

  const uniqueMessages = useMemo(() => {
    const seenIds = new Set();
    return chatMessages.filter((message) => {
      if (currentChatId && message.chatId !== currentChatId) {
        return false;
      }
      if (seenIds.has(message.id)) {
        return false;
      }
      seenIds.add(message.id);
      return true;
    });
  }, [chatMessages, currentChatId]);

  // Update the newestMessageId to work with chronological order
  const newestMessageId = chatMessages[chatMessages.length - 1]?.id;

  // Memoize the loading indicator logic to prevent infinite re-renders
  const shouldShowLoadingIndicator = useMemo(() => {
    // Don't show loading indicator if messages are being loaded (switching chats)
    if (loadingMessages) {
      return false;
    }

    // Show loading indicator if AI is actively typing for this chat (from SignalR)
    const isAiTypingInCurrentChat = currentChatId && aiTypingInChats[currentChatId];

    if (!isAiTypingInCurrentChat) {
      return false;
    }

    // Find the most recent user message to determine if AI should be responding
    const lastUserMessage = uniqueMessages
      .filter((msg) => msg.sender !== 'ai' && msg.sender !== 'System')
      .pop();

    // Don't show loader if there's no recent user message or it's too old (older than 30 seconds)
    // This prevents showing stale loading indicators
    if (!lastUserMessage || Date.now() - new Date(lastUserMessage.timestamp).getTime() > 30000) {
      return false;
    }

    // Check if there's already an AI response to the most recent user message
    // Look for AI messages that came after the last user message
    const lastUserMessageTime = new Date(lastUserMessage.timestamp).getTime();
    const hasAiResponseAfterLastUser = uniqueMessages.some(
      (msg) =>
        msg.sender === 'ai' &&
        msg.content &&
        new Date(msg.timestamp).getTime() > lastUserMessageTime
    );

    // Don't show loader if AI has already responded to the last user message
    if (hasAiResponseAfterLastUser) {
      return false;
    }

    // Don't show loader if we have an AI response in progress
    return !aiResponse;
  }, [uniqueMessages, currentChatId, aiTypingInChats, aiResponse, loadingMessages]);

  // Helper function to determine if a date separator should be shown
  const shouldShowDateSeparator = (currentMessage: any, previousMessage: any) => {
    if (!previousMessage) {
      return true;
    }

    const currentDate = new Date(currentMessage.timestamp);
    const previousDate = new Date(previousMessage.timestamp);

    return (
      currentDate.getDate() !== previousDate.getDate() ||
      currentDate.getMonth() !== previousDate.getMonth() ||
      currentDate.getFullYear() !== previousDate.getFullYear()
    );
  };

  useEffect(() => {
    if (
      chatMessages.length > prevMessagesLength &&
      (chatMessages[chatMessages.length - 1].sender === user?.id || !isUserScrolling)
    ) {
      scrollToBottom();
    }
  }, [chatMessages, prevMessagesLength, user?.id, isUserScrolling]);

  // Effect to auto-scroll to bottom when AI is typing, unless user is scrolling
  useEffect(() => {
    const isAiTypingInCurrentChat = currentChatId && aiTypingInChats[currentChatId];
    if (
      (isAiTyping || isAiTypingInCurrentChat) &&
      !isUserScrolling &&
      !isActivelyTyping &&
      messagesEndRef.current
    ) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isAiTyping, aiTypingInChats, currentChatId, aiResponse, isUserScrolling, isActivelyTyping]);

  // Effect to hide the "Scroll to Bottom" button when the user scrolls back to the bottom
  useEffect(() => {
    if (isAtBottom) {
      setShowScrollToBottomButton(false);
    }
  }, [isAtBottom]);

  // Reset typing state and AI response when switching chats
  useEffect(() => {
    setPrevMessagesLength(chatMessages.length);
    setAiResponse(null); // Reset AI response when switching chats
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [currentChatId, chatMessages.length, setAiResponse]);

  // Additional effect to ensure clean state when switching chats
  useEffect(() => {
    // Reset scroll state when switching chats
    setIsUserScrolling(false);
    setIsAtBottom(true);
    setShowScrollToBottomButton(false);

    // Scroll to bottom for the new chat
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
  }, [currentChatId]);

  const handleTypingProgress = () => {
    if (!isUserScrolling && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const isConsecutiveMessage = (
    currentMessage: ChatMessage,
    previousMessage: ChatMessage | undefined
  ): boolean => {
    if (!previousMessage) {
      return false;
    }

    return (
      currentMessage.sender === previousMessage.sender &&
      currentMessage.sender !== 'ai' &&
      // Check if messages are within 5 minutes of each other
      Math.abs(
        new Date(currentMessage.timestamp).getTime() - new Date(previousMessage.timestamp).getTime()
      ) <=
        5 * 60 * 1000
    );
  };

  return (
    <div className={`${styles.messageListContainer} ${loadingMessages ? styles.loading : ''}`}>
      <ScrollArea
        classNames={styles}
        className={styles.scrollArea}
        styles={{
          viewport: {
            /* Removed display: 'flex', */
          },
        }}
        type="never"
        data-theme={isDark ? 'dark' : 'light'}
        viewportRef={viewportRef}
        onWheel={handleScroll}
      >
        <Center>
          <div className={styles.messageContainer} aria-live="polite">
            {uniqueMessages.map((message, index) => {
              const previousMessage = uniqueMessages[index - 1];
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
              const showTimestamp =
                !previousMessage ||
                new Date(message.timestamp).getMinutes() !==
                  new Date(previousMessage.timestamp).getMinutes();

              const isConsecutive = isConsecutiveMessage(message, previousMessage);

              return (
                <React.Fragment key={`${message.id}-container`}>
                  {showDateSeparator && (
                    <div className={styles.dateSeparatorWrapper}>
                      <DateSeparator date={new Date(message.timestamp)} />
                    </div>
                  )}
                  <Message
                    key={message.id}
                    message={message}
                    isCurrentUser={message.sender === user?.id}
                    userName={message.sender === user?.id ? user?.name : message.sender}
                    isNewMessage={message.id === newestMessageId}
                    onTypingProgress={handleTypingProgress}
                    showTimestamp={showTimestamp}
                    isConsecutive={isConsecutive}
                  />
                </React.Fragment>
              );
            })}
            {shouldShowLoadingIndicator && (
              <Message
                key="ai-typing-placeholder"
                message={{
                  id: 'loading-message',
                  chatId: currentChatId || '',
                  sender: 'ai',
                  content: '',
                  timestamp: new Date().toISOString(),
                  type: 'ai',
                }}
                isCurrentUser={false}
                showTimestamp={false}
                isLoading
              />
            )}
            <div ref={messagesEndRef} /> {/* Ensure this is at the end */}
          </div>
        </Center>
      </ScrollArea>
      {showScrollToBottomButton && (
        <div
          style={{
            position: 'absolute',
            bottom: '16px',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            zIndex: '10',
          }}
        >
          <ActionIcon
            variant="default"
            color="gray"
            size="md"
            radius="xl"
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
            data-testid="scroll-to-bottom-button"
          >
            <IconArrowDown size={16} />
          </ActionIcon>
        </div>
      )}
    </div>
  );
};

export default MessageList;
