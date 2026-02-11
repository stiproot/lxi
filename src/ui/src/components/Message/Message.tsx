import React, { useEffect, useRef, useState } from 'react';
import { IconCheck, IconCopy } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import {
  ActionIcon,
  Avatar,
  CopyButton,
  Group,
  Loader,
  Paper,
  Text,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useChatContext } from '@/contexts/ChatContext';
import type { ChatMessage } from '@/types/ChatMessage';
import MarkdownRenderer from '@/utils/MarkdownRenderer';
import LxiLogo from '../../assets/lxi-logo-icon-original.svg?react';
import { useMessageTyping } from '../../hooks/useMessageTyping';
import styles from './Message.module.css';

interface MessageProps {
  message: ChatMessage;
  isCurrentUser: boolean;
  userName?: string;
  isNewMessage?: boolean;
  onTypingProgress?: () => void;
  showTimestamp: boolean;
  isConsecutive?: boolean;
  isLoading?: boolean; // Add this new prop
}

const Message: React.FC<MessageProps> = ({
  message,
  isCurrentUser,
  userName,
  isNewMessage = false,
  onTypingProgress = () => {},
  showTimestamp,
  isConsecutive = false,
  isLoading = false, // Default to false
}) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const animationRef = useRef<HTMLSpanElement>(null);
  const [copied, setCopied] = useState(false);
  const { setIsActivelyTyping, currentChatId } = useChatContext();

  const { typedText, isTyped } = useMessageTyping({
    content: message.content,
    isNewMessage: isNewMessage && message.sender === 'ai' && !isLoading,
    isSender: isCurrentUser ? 'user' : message.sender === 'ai' ? 'ai' : 'other',
    messageId: message.id,
    messageTimestamp: message.timestamp,
    onProgress: () => {
      onTypingProgress();
      if (!isTyped && !isLoading) {
        setIsActivelyTyping(true);
      }
    },
  });

  const getSenderType = () => {
    if (message.sender === 'ai') {
      return 'ai';
    }
    if (isCurrentUser) {
      return 'user';
    }
    return 'other';
  };

  // Clean up typing state when component unmounts or chat changes
  useEffect(() => {
    return () => {
      if (isTyped === false && message.sender === 'ai') {
        setIsActivelyTyping(false);
      }
    };
  }, []);

  // Reset typing state when switching chats
  useEffect(() => {
    if (message.sender === 'ai' && !isNewMessage) {
      setIsActivelyTyping(false);
    }
  }, [currentChatId, message.sender, isNewMessage, setIsActivelyTyping]);

  // This useEffect will handle setting isActivelyTyping to false when done
  useEffect(() => {
    if (isTyped) {
      setIsActivelyTyping(false);
    }
  }, [isTyped, setIsActivelyTyping]);

  const handleCopy = (copy: () => void) => {
    copy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Add repository change message handling
  if (message.type === 'repository_change') {
    return (
      <Text size="xs" c="dimmed" style={{ textAlign: 'center', margin: '1rem 0' }}>
        {message.content} • {format(parseISO(message.timestamp), 'HH:mm')}
      </Text>
    );
  }

  return (
    <Group
      className={`${styles.messageGroup} ${isCurrentUser ? styles.currentUser : ''} ${isNewMessage ? styles.newMessage : ''} ${isConsecutive ? styles.consecutive : ''}`}
      data-theme={isDark ? 'dark' : 'light'}
      data-sender={getSenderType()}
    >
      <div className={styles.bubbleWrapper}>
        {/* Show timestamp only for AI or current user */}
        {showTimestamp && (message.sender === 'ai' || isCurrentUser) && (
          <Text size="xs" c="dimmed" className={styles.timestamp}>
            {timestamp}
          </Text>
        )}
        {!isCurrentUser && message.sender !== 'ai' && !isConsecutive && (
          <div className={styles.senderInfo}>
            <Text size="sm" c="dimmed" className={styles.senderName}>
              {userName || message.sender}
            </Text>
            {showTimestamp && (
              <Text size="xs" c="dimmed" className={styles.otherUserTimestamp}>
                {timestamp}
              </Text>
            )}
          </div>
        )}
        <div className={styles.bubbleRow} data-sender={getSenderType()}>
          {!isCurrentUser && !isConsecutive && (
            <div className={styles.avatarWrapper} data-sender={getSenderType()}>
              {message.sender === 'ai' ? (
                <LxiLogo className={styles.aiAvatar} />
              ) : (
                <Avatar
                  radius="xl"
                  name={userName || message.sender}
                  size="md"
                  color="blue"
                  className={styles.otherUserAvatar}
                />
              )}
            </div>
          )}
          <Paper
            className={`${styles.bubble} ${
              isCurrentUser
                ? styles.userBubble
                : message.sender === 'ai'
                  ? styles.aiBubble
                  : styles.otherUserBubble
            } ${isConsecutive ? styles.consecutiveBubble : ''}`}
          >
            {isCurrentUser || message.sender !== 'ai' ? (
              <Text size="md">{message.content}</Text>
            ) : (
              <>
                {isLoading ? (
                  // Show the loader for loading placeholders
                  <div className={styles.typingIndicatorContainer}>
                    <Loader size="sm" color="gray.5" type="dots" />
                  </div>
                ) : !isTyped && message.content ? (
                  // Show typing animation for actual AI messages
                  <span ref={animationRef}>
                    <MarkdownRenderer text={typedText} />
                  </span>
                ) : message.content ? (
                  // Show complete message with copy button
                  <>
                    <MarkdownRenderer text={message.content} />
                    <div>
                      <CopyButton value={message.content}>
                        {({ copy }) => (
                          <Tooltip label="Copy" withArrow position="bottom">
                            <ActionIcon
                              size={30}
                              variant="subtle"
                              color="gray"
                              radius="md"
                              onClick={() => handleCopy(copy)}
                            >
                              {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </CopyButton>
                    </div>
                  </>
                ) : null}
              </>
            )}
          </Paper>
        </div>
      </div>
    </Group>
  );
};

export default Message;
