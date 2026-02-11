import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { debounce } from 'lodash';
import { v4 as uuidv4 } from 'uuid';
import { notifications } from '@mantine/notifications';
import { NotificationService } from '@/services/notificationService';
import { StorageService } from '@/services/storage.service';
import { Chat, ChatMessage, User } from '@/types';
import {
  addChatParticipant,
  createNewChat,
  deleteChat,
  getAllChats,
  getChatInfo,
  getChatRepository,
  getUserById,
  pinChat,
  removeChatParticipant,
  renameChat,
  updateChatRepository,
} from '../services/api';
import { signalRService } from '../services/signalRService';
import { handleError } from '../utils/errorHandler';
import { useUserContext } from './UserContext';

type UserStatus = 'online' | 'offline' | 'away';

interface ChatContextType {
  chats: Chat[];
  chatMessages: ChatMessage[];
  loadingChats: boolean;
  loadingMessages: boolean;
  error: Error | null;
  isAiTyping: boolean;
  aiResponse: string | null;
  currentChatId: string | null;
  fetchChats: () => Promise<void>;
  fetchChatMessages: (chatId: string) => Promise<void>;
  switchChat: (chatId: string, isNewChat: boolean) => void;
  addMessage: (message: ChatMessage) => Promise<void>;
  createChat: () => Promise<Chat>;
  deleteChatById: (chatId: string) => Promise<void>;
  renameChatById: (chatId: string, newName: string) => Promise<void>;
  pinChatById: (chatId: string, pin: boolean) => Promise<void>;
  clearChatMessages: () => void;
  startTyping: () => void;
  stopTyping: () => void;
  setAiResponse: (response: string | null) => void;
  skipTyping: () => void;
  addParticipant: (chatId: string, participantId: string) => Promise<void>;
  participants: Record<string, User>;
  fetchParticipants: (participantIds: string[]) => Promise<void>;
  updateRepository: (chatId: string, repositoryName: string) => Promise<void>;
  getCurrentRepository: (chatId: string) => Promise<string>;
  isActivelyTyping: boolean;
  aiTypingInChats: Record<string, boolean>;
  setIsActivelyTyping: (isActivelyTyping: boolean) => void;
  skipTypingTimestamp: number;
  removeParticipant: (chatId: string, participantId: string) => Promise<void>;
  participantStatuses: Record<string, UserStatus>;
  handleParticipantUpdate: (
    chatId: string,
    participantId: string,
    action: 'add' | 'remove'
  ) => Promise<void>;
  shouldMessageHaveTyping: (messageId: string) => boolean;
  markMessageForTyping: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'chatMessages';

const saveMessagesToLocalStorage = (messages: ChatMessage[]) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messages));
};

const loadMessagesFromLocalStorage = (): ChatMessage[] => {
  const storedMessages = localStorage.getItem(LOCAL_STORAGE_KEY);
  return storedMessages ? JSON.parse(storedMessages) : [];
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(loadMessagesFromLocalStorage());
  const [loadingChats, setLoadingChats] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [errorNotified, setErrorNotified] = useState<boolean>(false);
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const { user: currentUser } = useUserContext();
  const [participants, setParticipants] = useState<Record<string, User>>({});
  const [isActivelyTyping, setIsActivelyTyping] = useState<boolean>(false);
  const [participantStatuses, setParticipantStatuses] = useState<Record<string, UserStatus>>({});
  const [aiTypingInChats, setAiTypingInChats] = useState<Record<string, boolean>>({});
  const [skipTypingTimestamp, setSkipTypingTimestamp] = useState<number>(0);
  // Track which messages should actually have typing animations (only truly new AI messages)
  const [messagesWithTyping, setMessagesWithTyping] = useState<Set<string>>(new Set());

  // Core message handling functionality - now uses SignalR
  const addMessage = useCallback(async (message: ChatMessage, repositoryName?: string) => {
    try {
      // Use SignalR to send message, which will handle AI triggering and broadcasting
      await signalRService.sendUserMessage(message.chatId, message, repositoryName);

      // Local state will be updated via SignalR ReceiveMessage event
      // No need to update state here as it will come through the SignalR event
    } catch (err: any) {
      handleError(err, 'Error sending message');
      throw err; // Re-throw to let caller handle
    }
  }, []);

  // Helper for system messages - update to only handle local state
  const addSystemMessage = useCallback(
    async (chatId: string, content: string, type: 'repository_change' | 'text' | 'ai') => {
      const systemMessage: ChatMessage = {
        id: uuidv4(),
        chatId,
        type,
        content,
        timestamp: new Date().toISOString(),
        sender: 'System',
      };

      // Add message only if it's not a duplicate
      setChatMessages((prev) => {
        const isDuplicate = prev.some(
          (msg) =>
            msg.type === type &&
            msg.content === content &&
            Math.abs(
              new Date(msg.timestamp).getTime() - new Date(systemMessage.timestamp).getTime()
            ) < 1000
        );
        return isDuplicate ? prev : [...prev, systemMessage];
      });
    },
    []
  );

  // Add this new method to handle repository changes consistently
  const handleRepositoryChange = useCallback(
    async (chatId: string, repoName: string, changedBy: string) => {
      // Update chats state
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                currentRepository: repoName,
                lastRepositoryChange: new Date().toISOString(),
              }
            : chat
        )
      );

      // Show notification only if it was changed by someone else
      if (changedBy !== currentUser?.id) {
        const displayName = participants[changedBy]?.name || changedBy;
        NotificationService.showRepositoryChange(displayName, repoName);
      }
    },
    [currentUser?.id, participants]
  );

  // Repository update functionality
  const updateRepository = useCallback(
    async (chatId: string, repositoryName: string) => {
      try {
        // First update the server - this will trigger SignalR event for all clients
        await updateChatRepository(chatId, repositoryName);

        // Add system message locally for immediate feedback only if we're initiating the change
        await addSystemMessage(
          chatId,
          `Repository changed to: ${repositoryName}`,
          'repository_change'
        );

        // Update local state
        await handleRepositoryChange(chatId, repositoryName, currentUser?.id || 'System');
      } catch (err: any) {
        handleError(err, 'Error updating repository');
        throw err;
      }
    },
    [handleRepositoryChange, currentUser?.id, addSystemMessage]
  );

  const getCurrentRepository = useCallback(async (chatId: string) => {
    try {
      return await getChatRepository(chatId);
    } catch (err: any) {
      // Don't throw for empty repository
      if (err?.response?.status === 404) {
        return '';
      }
      handleError(err, 'Error getting current repository');
      throw err;
    }
  }, []);

  useEffect(() => {
    saveMessagesToLocalStorage(chatMessages);
  }, [chatMessages]);

  useEffect(() => {
    const handleStatusChange = (userId: string, status: UserStatus) => {
      setParticipantStatuses((prev) => ({ ...prev, [userId]: status }));

      // Only show notification if we have the user info and it's not the current user
      const user = participants[userId];
      if (user && user.id !== currentUser?.id) {
        if (status === 'online') {
          NotificationService.showUserOnline(user.name);
        } else if (status === 'offline') {
          NotificationService.showUserOffline(user.name);
        }
      }
    };

    const unsubscribeOnline = signalRService.onUserOnline((id) => handleStatusChange(id, 'online'));
    const unsubscribeOffline = signalRService.onUserOffline((id) =>
      handleStatusChange(id, 'offline')
    );

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, [participants, currentUser?.id]);

  // Consolidate connection setup effects into one
  useEffect(() => {
    const setupConnection = async () => {
      // Only start connection if we have a user and are not already connected
      if (currentUser && signalRService.getChatHubStatus() !== 'connected') {
        await signalRService.startConnection();

        // Join chat if we have a current chat ID
        if (currentChatId) {
          await signalRService.joinChat(currentChatId);
        }
      }
    };

    setupConnection();

    return () => {
      if (currentChatId) {
        signalRService.leaveChat(currentChatId);
      }
    };
  }, [currentUser, currentChatId]);

  useEffect(() => {
    const unsubscribeMessage = signalRService.onMessage((message) => {
      if (message.chatId === currentChatId) {
        // Mark AI messages for typing animation if they're truly new
        if (message.sender === 'ai') {
          setMessagesWithTyping((prev) => new Set(prev).add(message.id));
        }

        setChatMessages((prev) => {
          // Check for duplicates or recent similar messages
          const isDuplicate = prev.some(
            (msg) =>
              msg.id === message.id ||
              (msg.type === message.type &&
                msg.content === message.content &&
                Math.abs(
                  new Date(msg.timestamp).getTime() - new Date(message.timestamp).getTime()
                ) < 1000)
          );
          return isDuplicate ? prev : [...prev, message];
        });
      }
    });

    return () => {
      unsubscribeMessage();
    };
  }, [currentChatId]);

  // Single repository change handler
  useEffect(() => {
    const unsubscribe = signalRService.onRepositoryChange(
      debounce(async (chatId, repoName, changedBy) => {
        if (chatId === currentChatId) {
          await handleRepositoryChange(chatId, repoName, changedBy);
        }
      }, 300)
    );

    return () => unsubscribe();
  }, [currentChatId, handleRepositoryChange]);

  const fetchChats = useCallback(async () => {
    setLoadingChats(true);
    setError(null);
    try {
      const response = await getAllChats();
      setChats(response);
      setErrorNotified(false);
    } catch (err: any) {
      setError(new Error(err.message || 'An unknown error occurred'));
      if (!errorNotified) {
        handleError(err, 'Error fetching chats');
        setErrorNotified(true);
      }
    } finally {
      setLoadingChats(false);
    }
  }, [errorNotified]);

  const fetchChatMessages = useCallback(
    async (chatId: string) => {
      setLoadingMessages(true);
      setIsAiTyping(false); // Reset typing state when loading messages
      setAiResponse(null); // Reset AI response when loading messages
      setError(null);
      try {
        const response = await getChatInfo(chatId);
        setChatMessages(response.messages);
        setErrorNotified(false);
      } catch (err: any) {
        setError(new Error(err.message || 'An unknown error occurred'));
        if (!errorNotified) {
          handleError(err, 'Error fetching chat messages');
          setErrorNotified(true);
        }
      } finally {
        setLoadingMessages(false);
      }
    },
    [errorNotified]
  );

  const switchChat = useCallback(
    async (chatId: string, isNewChat: boolean = false) => {
      // Prevent switching to the same chat or multiple simultaneous switches
      if ((currentChatId === chatId && !isNewChat) || loadingMessages) {
        return;
      }

      // Set loading state immediately to prevent UI flicker
      setLoadingMessages(true);

      // Immediately clear all typing and response states
      setIsAiTyping(false);
      setAiResponse(null);
      setIsActivelyTyping(false);
      setAiTypingInChats({});
      setMessagesWithTyping(new Set());

      try {
        // Leave current chat first if there is one
        if (currentChatId && currentChatId !== chatId) {
          await signalRService.leaveChat(currentChatId);
        }

        // Set the new chat ID immediately to prevent glitches
        setCurrentChatId(chatId);

        if (!isNewChat) {
          // Clear messages immediately to prevent old content from showing
          setChatMessages([]);

          // Join the new chat
          await signalRService.joinChat(chatId);

          const [chatInfo, repo] = await Promise.all([
            getChatInfo(chatId),
            getCurrentRepository(chatId).catch(() => null),
          ]);

          // Set the new messages immediately (no transition needed)
          setChatMessages(chatInfo.messages);

          // Handle repository change
          if (repo) {
            setChats((prevChats) => {
              const currentChat = prevChats.find((c) => c.id === chatId);
              if (currentChat && currentChat.currentRepository !== repo) {
                const updatedChats = prevChats.map((chat) =>
                  chat.id === chatId
                    ? {
                        ...chat,
                        currentRepository: repo,
                        lastRepositoryChange: new Date().toISOString(),
                      }
                    : chat
                );

                // Show notification for repository change
                NotificationService.showRepositoryChange('System', repo);
                return updatedChats;
              }
              return prevChats;
            });
          }
        } else {
          // For new chats, just clear messages and join
          setChatMessages([]);
          await signalRService.joinChat(chatId);
        }
      } catch (err) {
        handleError(err, 'Error switching chat');
        setCurrentChatId(null);
        setChatMessages([]);
      } finally {
        setLoadingMessages(false);
      }
    },
    [currentChatId, getCurrentRepository, loadingMessages]
  );

  const createChat = useCallback(async (): Promise<Chat> => {
    setLoadingChats(true);
    setError(null);
    try {
      const temporaryName = `Chat ${chats.length + 1}`;
      const timestamp = new Date().toISOString();

      const chat = {
        id: uuidv4(),
        name: temporaryName,
        participantIds: [StorageService.usrId()],
        ownerId: StorageService.usrId(),
        messages: [],
        timestamp,
        isPinned: false,
        lastModified: timestamp,
      } as Chat;

      await createNewChat(chat);

      setChats((prevChats) => [...prevChats, chat]);
      // Don't show notification for chat creation - it's confusing for users
      return chat;
    } catch (err: any) {
      setError(new Error(err.message || 'An unknown error occurred'));
      handleError(err, 'Error creating chat');
      throw err;
    } finally {
      setLoadingChats(false);
    }
  }, [chats.length]);

  const deleteChatById = useCallback(
    async (chatId: string) => {
      setLoadingChats(true);
      setError(null);
      try {
        const chat = chats.find((chat) => chat.id === chatId);
        if (chat?.ownerId !== currentUser?.id) {
          throw new Error('Only the chat owner can delete this chat.');
        }
        await deleteChat(chatId);
        setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
        setChatMessages((prevMessages) =>
          prevMessages.filter((message) => message.chatId !== chatId)
        );
        notifications.show({
          title: 'Chat deleted',
          message: `Chat with ID ${chatId} has been deleted.`,
          color: 'green',
          radius: 'md',
        });
      } catch (err: any) {
        setError(new Error(err.message || 'An unknown error occurred'));
        handleError(err, 'Error deleting chat');
      } finally {
        setLoadingChats(false);
      }
    },
    [chats, currentUser]
  );

  const renameChatById = useCallback(async (chatId: string, newName: string) => {
    setLoadingChats(true);
    setError(null);
    try {
      await renameChat(chatId, newName);
      setChats((prevChats) =>
        prevChats.map((chat) => (chat.id === chatId ? { ...chat, name: newName } : chat))
      );
      notifications.show({
        title: 'Chat renamed',
        message: `Chat with ID ${chatId} has been renamed to ${newName}.`,
        color: 'green',
        radius: 'md',
      });
    } catch (err: any) {
      setError(new Error(err.message || 'An unknown error occurred'));
      handleError(err, 'Error renaming chat');
    } finally {
      setLoadingChats(false);
    }
  }, []);

  const pinChatById = useCallback(async (chatId: string, pin: boolean) => {
    setLoadingChats(true);
    setError(null);
    try {
      await pinChat(chatId, pin);
      setChats((prevChats) =>
        prevChats.map((chat) => (chat.id === chatId ? { ...chat, isPinned: pin } : chat))
      );
      notifications.show({
        title: pin ? 'Chat pinned' : 'Chat unpinned',
        message: `Chat with ID ${chatId} has been ${pin ? 'pinned' : 'unpinned'}.`,
        color: 'green',
        radius: 'md',
      });
    } catch (err: any) {
      setError(new Error(err.message || 'An unknown error occurred'));
      handleError(err, `Error ${pin ? 'pinning' : 'unpinning'} chat`);
    } finally {
      setLoadingChats(false);
    }
  }, []);

  const fetchParticipants = useCallback(async (participantIds: string[]) => {
    try {
      const userPromises = participantIds.map((id) => getUserById(id));
      const users = await Promise.all(userPromises);
      const userMap = users.reduce(
        (acc, user) => ({
          ...acc,
          [user.id]: user,
        }),
        {}
      );
      setParticipants((prev) => ({ ...prev, ...userMap }));
    } catch (error) {
      handleError(error, 'Error fetching participants');
    }
  }, []);

  const handleParticipantUpdate = useCallback(
    async (chatId: string, participantId: string, action: 'add' | 'remove') => {
      try {
        if (action === 'add') {
          await addChatParticipant(chatId, participantId);
        } else {
          await removeChatParticipant(chatId, participantId);
        }

        // Fetch user data if not already in cache
        const participant = participants[participantId] || (await getUserById(participantId));

        // Update local state
        setChats((prevChats) =>
          prevChats.map((chat) =>
            chat.id === chatId
              ? {
                  ...chat,
                  participantIds:
                    action === 'add'
                      ? [...chat.participantIds, participantId]
                      : chat.participantIds.filter((id) => id !== participantId),
                }
              : chat
          )
        );

        // Update participant status
        if (action === 'add') {
          await fetchParticipants([participantId]);
        } else {
          setParticipantStatuses((prev) => {
            const { [participantId]: _, ...rest } = prev;
            return rest;
          });
        }

        notifications.show({
          title: `Member ${action === 'add' ? 'added' : 'removed'}`,
          message: `${participant.name} has been ${action === 'add' ? 'added to' : 'removed from'} the chat`,
          color: 'green',
        });
      } catch (err: any) {
        handleError(err, `Error ${action === 'add' ? 'adding' : 'removing'} participant`);
        throw err;
      }
    },
    [participants, fetchParticipants]
  );

  const clearChatMessages = useCallback(() => {
    setChatMessages([]);
  }, []);

  const startTyping = useCallback(() => {
    // Only start typing if we're not in a loading state
    if (!loadingMessages && currentChatId) {
      setIsAiTyping(true);
      // Broadcast to other users
      signalRService.notifyAiTyping(currentChatId, true);
    }
  }, [loadingMessages, currentChatId]);

  const stopTyping = useCallback(() => {
    if (currentChatId) {
      signalRService.notifyAiTyping(currentChatId, false);
    }
    setIsAiTyping(false);
    setAiResponse(null);
  }, [currentChatId]);

  const skipTyping = useCallback(() => {
    setIsAiTyping(false);
    setIsActivelyTyping(false);
    // Update timestamp to signal all typing animations to skip
    setSkipTypingTimestamp(Date.now());
  }, []);

  const removeParticipant = useCallback(async (chatId: string, participantId: string) => {
    try {
      await removeChatParticipant(chatId, participantId);
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat.id === chatId
            ? {
                ...chat,
                participantIds: chat.participantIds.filter((id) => id !== participantId),
              }
            : chat
        )
      );
    } catch (error) {
      handleError(error, 'Error removing participant');
      throw error;
    }
  }, []);

  // Methods to manage which messages should have typing animations
  const shouldMessageHaveTyping = useCallback(
    (messageId: string) => {
      return messagesWithTyping.has(messageId);
    },
    [messagesWithTyping]
  );

  const markMessageForTyping = useCallback((messageId: string) => {
    setMessagesWithTyping((prev) => new Set(prev).add(messageId));
  }, []);

  // Add effect to listen for AI typing from other users
  useEffect(() => {
    const unsubscribeAiTyping = signalRService.onAiTypingStatus((chatId, isTyping) => {
      setAiTypingInChats((prev) => ({
        ...prev,
        [chatId]: isTyping,
      }));
    });

    return () => {
      unsubscribeAiTyping();
    };
  }, []);

  return (
    <ChatContext.Provider
      value={{
        chats,
        chatMessages,
        loadingChats,
        loadingMessages,
        error,
        isAiTyping,
        aiResponse,
        currentChatId,
        fetchChats,
        fetchChatMessages,
        switchChat,
        addMessage,
        createChat,
        deleteChatById,
        renameChatById,
        pinChatById,
        clearChatMessages,
        startTyping,
        stopTyping,
        setAiResponse,
        aiTypingInChats,
        skipTyping,
        participants,
        fetchParticipants,
        isActivelyTyping,
        setIsActivelyTyping,
        skipTypingTimestamp,
        updateRepository,
        getCurrentRepository,
        removeParticipant,
        participantStatuses,
        handleParticipantUpdate,
        addParticipant: (chatId: string, participantId: string) =>
          handleParticipantUpdate(chatId, participantId, 'add'),
        shouldMessageHaveTyping,
        markMessageForTyping,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
};
