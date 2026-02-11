// src/components/Chatbot/Chatbot.tsx
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { Center, Stack, Text, useMantineColorScheme } from '@mantine/core';
import { useChatContext } from '../../contexts/ChatContext';
import { useUserContext } from '../../contexts/UserContext';
import MessageInput from '../MessageInput/MessageInput';
import MessageList from '../MessageList/MessageList';
import NoChatHistory from '../NoChatHistory/NoChatHistory';
import { ParticipantManager } from '../ParticipantManager/ParticipantManager';
import classes from './Chatbot.module.css';

const ChatbotPage: React.FC = () => {
  const { chatId } = useParams<{ chatId: string }>();
  const navigate = useNavigate();
  const [selectedRepo, setSelectedRepo] = useState<string>(() => {
    // Initialize from localStorage to persist across chat switches
    return localStorage.getItem('selectedRepo') || '';
  });
  const { user } = useUserContext();
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const {
    chatMessages,
    addMessage,
    fetchChats,
    createChat,
    switchChat,
    clearChatMessages,
    stopTyping,
    setAiResponse,
    aiTypingInChats,
    currentChatId,
    loadingMessages, // Add this to track loading state during chat switching
  } = useChatContext();

  // Use ref to avoid switchChat dependency in useEffect
  const switchChatRef = useRef(switchChat);
  switchChatRef.current = switchChat;

  useEffect(() => {
    fetchChats().finally(() => {
      setIsInitialLoad(false);
    });
  }, [fetchChats]);

  useEffect(() => {
    if (!chatId) {
      clearChatMessages();
      setIsInitialLoad(false);
      return;
    }

    // Only switch to chat if we haven't already switched to it
    // (prevents double-switching when creating new chats)
    if (currentChatId !== chatId) {
      const initializeChat = async () => {
        try {
          setIsInitialLoad(true);

          // Clear any previous states immediately for smooth transition
          stopTyping();
          setAiResponse(null);

          // Use ref to avoid dependency issues and prevent infinite loops
          await switchChatRef.current(chatId, false);
        } catch (error) {
          console.error('Error switching chat:', error);
          setIsInitialLoad(false);
        } finally {
          setIsInitialLoad(false);
        }
      };

      initializeChat();
    } else {
      setIsInitialLoad(false);
    }

    return () => {
      stopTyping();
      setAiResponse(null);
    };
  }, [chatId, currentChatId, clearChatMessages, stopTyping, setAiResponse]); // Removed switchChat to prevent infinite loop

  const handleSend = async (input: string) => {
    if (input.trim() === '') {
      return;
    }

    try {
      let currentChatId: string = chatId || '';
      let isNewChat = false;
      if (!currentChatId) {
        const newChat = await createChat();
        currentChatId = newChat.id;
        await fetchChats();
        navigate(`/chat/${currentChatId}`);
        isNewChat = true;

        // Properly switch to the new chat and join SignalR group
        await switchChatRef.current(currentChatId, true);
      }

      // Create user message
      const newMessage = {
        id: uuidv4(),
        chatId: currentChatId,
        sender: user?.id || '',
        content: input,
        timestamp: new Date().toISOString(),
        type: 'text' as const, // Using const assertion to specify literal type
      };

      // For new chats, we need to ensure we join the SignalR group before sending the message
      // to receive the AI typing status
      if (isNewChat) {
        // Give a small delay to ensure navigation and context updates are complete
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Send message through SignalR - AI triggering and loading indicators are handled server-side
      await addMessage(newMessage);
    } catch (error) {
      console.error('Error sending message:', error);
      // Clear any loading states on error to prevent stuck loading indicators
      setAiResponse(null);
    }
  };

  // Loading state is now handled entirely by SignalR AI typing status
  const isAiTypingInCurrentChat = currentChatId && aiTypingInChats[currentChatId];
  const shouldShowLoading = Boolean(isAiTypingInCurrentChat);

  const hasMessages = chatMessages.length > 0;
  const isLoadingChat = loadingMessages || isInitialLoad;
  const shouldShowMessageList = hasMessages || isLoadingChat;

  return (
    <Stack
      gap={0}
      className={`${classes.container} ${shouldShowMessageList ? classes.hasMessages : ''}`}
      data-theme={isDark ? 'dark' : 'light'}
    >
      <div className={classes.chatContainer}>
        {shouldShowMessageList ? <MessageList isSending={shouldShowLoading} /> : <NoChatHistory />}
      </div>
      <Stack>
        <div className={classes.messageInputContainer}>
          {chatId && hasMessages && (
            <div className={classes.participantsContainer}>
              <ParticipantManager chatId={chatId} />
            </div>
          )}
          <MessageInput
            handleSend={handleSend}
            isSending={shouldShowLoading}
            selectedRepo={selectedRepo}
            setSelectedRepo={setSelectedRepo}
          />
        </div>
        <Center>
          <Text size="xs" c="dimmed">
            Lxi can make mistakes. Check important info.
          </Text>
        </Center>
      </Stack>
    </Stack>
  );
};

export default ChatbotPage;
