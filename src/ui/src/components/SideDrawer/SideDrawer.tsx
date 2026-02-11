import React, { useMemo, useState } from 'react';
import {
  IconAlertTriangleFilled,
  IconLogout,
  IconMessageCirclePlus,
  IconMessageReport,
  IconSettings,
} from '@tabler/icons-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Divider,
  Drawer,
  Group,
  Modal,
  NavLink,
  ScrollArea,
  Skeleton,
  Space,
  Stack,
  Text,
  ThemeIcon,
  Title,
  useMantineColorScheme,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useChatContext } from '../../contexts/ChatContext'; // Import the useChatContext hook
import { useUserContext } from '../../contexts/UserContext';
import { OktaAuthService } from '../../services/auth/oktaAuth.service';
import { groupChatsByDate } from '../../utils/ChatUtils';
import MenuChatList from '../MenuChatList/MenuChatList';
import classes from './SideDrawer.module.css';

interface SideDrawerProps {
  opened: boolean;
  onClose: () => void;
}

const SideDrawer: React.FC<SideDrawerProps> = ({ opened, onClose }) => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const navigate = useNavigate();
  const oktaAuthService = new OktaAuthService();
  const location = useLocation();

  // Use the useChatContext hook to fetch chats
  const {
    chats,
    createChat,
    deleteChatById,
    renameChatById,
    pinChatById,
    loadingChats,
    switchChat,
  } = useChatContext();
  const { user: currentUser } = useUserContext();
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newChatName, setNewChatName] = useState<string>('');
  const [originalChatName, setOriginalChatName] = useState<string>('');
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);

  const logout = async () => {
    await oktaAuthService.logout();
  };

  const goToFeedback = () => {
    window.open('https://github.com/stiproot/lxi/issues', '_blank', 'noopener,noreferrer');
  };

  const handleChatSelect = async (chatId: string) => {
    try {
      await switchChat(chatId, false);
      navigate(`/chat/${chatId}`);
      onClose();
    } catch (error) {
      console.error('Error switching chat:', error);
    }
  };

  const handleCreateNewChat = async () => {
    try {
      const newChat = await createChat();
      switchChat(newChat.id, true);
      navigate(`/chat/${newChat.id}`);
      onClose();
    } catch (error) {
      console.error('Failed to create new chat:', error);
    }
  };

  const handleDeleteChat = async () => {
    if (chatToDelete) {
      const chat = chats.find((c) => c.id === chatToDelete);
      if (chat?.ownerId !== currentUser?.id) {
        notifications.show({
          title: 'Error',
          message: 'Only the chat owner can delete this chat.',
          color: 'red',
          radius: 'md',
        });
        setDeleteModalOpened(false);
        return;
      }
      await deleteChatById(chatToDelete);
      if (location.pathname === `/chat/${chatToDelete}`) {
        navigate('/');
      }
      setChatToDelete(null);
      setDeleteModalOpened(false);
    }
  };

  const handleRenameChat = async (chatId: string) => {
    if (newChatName && newChatName !== originalChatName) {
      try {
        await renameChatById(chatId, newChatName);
        setEditingChatId(null);
        setNewChatName('');
      } catch (error) {
        console.error('Failed to rename chat:', error);
        setNewChatName(originalChatName);
        setEditingChatId(null);
      }
    } else {
      setEditingChatId(null);
      setNewChatName('');
    }
  };

  const openDeleteModal = (chatId: string) => {
    setChatToDelete(chatId);
    setDeleteModalOpened(true);
  };

  const startEditing = (chatId: string, currentName: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat?.ownerId !== currentUser?.id) {
      notifications.show({
        title: 'Error',
        message: 'Only the chat owner can rename this chat.',
        color: 'red',
        radius: 'md',
      });
      return;
    }
    setEditingChatId(chatId);
    setNewChatName(currentName);
    setOriginalChatName(currentName);
    setIsInputFocused(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewChatName(e.currentTarget.value);
  };

  const handleInputBlur = () => {
    if (isInputFocused) {
      setIsInputFocused(false);
      if (editingChatId) {
        handleRenameChat(editingChatId);
      }
    }
  };

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && editingChatId) {
      handleRenameChat(editingChatId);
    }
  };

  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.stopPropagation();
  };

  const togglePinChat = async (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      await pinChatById(chatId, !chat.isPinned);
    }
  };

  const groupedChats = useMemo(() => {
    const sortedChats = [...chats].sort(
      (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
    const isPinned = sortedChats.filter((chat) => chat.isPinned);
    const unpinned = sortedChats.filter((chat) => !chat.isPinned);
    return {
      isPinned,
      ...groupChatsByDate(unpinned),
    };
  }, [chats]);

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        title={<Box className={classes.hiddenLogo} />} // Empty Box to maintain header height
        position="left"
        size={250}
        withOverlay={false}
        withCloseButton={false}
        styles={{
          inner: {
            zIndex: 20,
          },
          root: {
            backgroundColor: 'var(--drawer-bg)', // Use CSS variable for background color
          },
          content: {
            borderTopRightRadius: '32px',
            borderBottomRightRadius: '32px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            borderRightColor: 'var(--drawer-border-color)', // Use CSS variable for border color
            borderRightStyle: 'solid',
            borderRightWidth: '1px',
            overflow: 'hidden',
            height: '100vh', // Set fixed height
            backgroundImage: 'var(--drawer-bg-image)', // Use CSS variable for background image
          },
          body: {
            flex: 1,
            padding: 0,
          },
          header: {
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '16px', // Adjust padding to match the header
            paddingTop: '12px',
            backgroundColor: 'transparent',
          },
        }}
        data-theme={isDark ? 'dark' : 'light'} // Set data-theme attribute
      >
        <Box
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            height: '100%',
          }}
        >
          <Stack p="sm">
            <Button
              justify="flex-start"
              variant="gradient"
              radius={8}
              gradient={{ from: 'blue', to: 'grape', deg: 166 }}
              leftSection={<IconMessageCirclePlus size="1rem" stroke={2.5} color="#f8f9fa" />}
              onClick={handleCreateNewChat}
            >
              <Text c="gray.0" size="sm">
                Start New Chat
              </Text>
            </Button>
            <ScrollArea.Autosize
              type="never"
              mah="calc(100vh - 260px)"
              style={{ display: 'block' }}
              classNames={classes}
            >
              {loadingChats ? (
                <Stack gap="xs">
                  <Space />
                  <Skeleton height={20} width="50%" radius="md" />
                  <Stack gap={0}>
                    <Skeleton height={25} width="100%" radius="md" mb="xs" />
                    <Skeleton height={25} width="100%" radius="md" mb="xs" />
                    <Skeleton height={25} width="100%" radius="md" mb="xs" />
                  </Stack>
                  <Space />
                  <Skeleton height={20} width="55%" radius="md" />
                  <Stack gap={0}>
                    <Skeleton height={25} width="100%" radius="md" mb="xs" />
                    <Skeleton height={25} width="100%" radius="md" mb="xs" />
                  </Stack>
                  <Space />
                  <Skeleton height={20} width="40%" radius="md" />
                  <Stack gap={0}>
                    <Skeleton height={25} width="100%" radius="md" mb="xs" />
                    <Skeleton height={25} width="100%" radius="md" mb="xs" />
                    <Skeleton height={25} width="100%" radius="md" mb="xs" />
                    <Skeleton height={25} width="100%" radius="md" mb="xs" />
                  </Stack>
                  <Space />
                  <Skeleton height={20} width="60%" radius="md" />
                  <Stack gap={0}>
                    <Skeleton height={25} width="100%" radius="md" mb="xs" />
                    <Skeleton height={25} width="100%" radius="md" mb="xs" />
                  </Stack>
                </Stack>
              ) : (
                <div style={{ display: 'block' }}>
                  {groupedChats.isPinned.length > 0 && (
                    <>
                      <Text c="dimmed" size="sm" p={4} fw={500}>
                        Pinned
                      </Text>
                      <MenuChatList
                        chats={groupedChats.isPinned}
                        editingChatId={editingChatId}
                        newChatName={newChatName}
                        handleInputChange={handleInputChange}
                        handleInputBlur={handleInputBlur}
                        handleInputKeyPress={handleInputKeyPress}
                        handleInputClick={handleInputClick}
                        startEditing={startEditing}
                        openDeleteModal={openDeleteModal}
                        handleChatSelect={handleChatSelect}
                        togglePinChat={togglePinChat}
                      />
                      <Space m="lg" />
                    </>
                  )}
                  {groupedChats.today.length > 0 && (
                    <>
                      <Text c="dimmed" size="sm" p={4} fw={500}>
                        Today
                      </Text>
                      <MenuChatList
                        chats={groupedChats.today}
                        editingChatId={editingChatId}
                        newChatName={newChatName}
                        handleInputChange={handleInputChange}
                        handleInputBlur={handleInputBlur}
                        handleInputKeyPress={handleInputKeyPress}
                        handleInputClick={handleInputClick}
                        startEditing={startEditing}
                        openDeleteModal={openDeleteModal}
                        handleChatSelect={handleChatSelect}
                        togglePinChat={togglePinChat}
                      />
                      <Space m="lg" />
                    </>
                  )}
                  {groupedChats.yesterday.length > 0 && (
                    <>
                      <Text c="dimmed" size="sm" p={8} fw={500}>
                        Yesterday
                      </Text>
                      <MenuChatList
                        chats={groupedChats.yesterday}
                        editingChatId={editingChatId}
                        newChatName={newChatName}
                        handleInputChange={handleInputChange}
                        handleInputBlur={handleInputBlur}
                        handleInputKeyPress={handleInputKeyPress}
                        handleInputClick={handleInputClick}
                        startEditing={startEditing}
                        openDeleteModal={openDeleteModal}
                        handleChatSelect={handleChatSelect}
                        togglePinChat={togglePinChat}
                      />
                      <Space m="lg" />
                    </>
                  )}
                  {groupedChats.last30Days.length > 0 && (
                    <>
                      <Text c="dimmed" size="sm" p={8} fw={500}>
                        Last 30 Days
                      </Text>
                      <MenuChatList
                        chats={groupedChats.last30Days}
                        editingChatId={editingChatId}
                        newChatName={newChatName}
                        handleInputChange={handleInputChange}
                        handleInputBlur={handleInputBlur}
                        handleInputKeyPress={handleInputKeyPress}
                        handleInputClick={handleInputClick}
                        startEditing={startEditing}
                        openDeleteModal={openDeleteModal}
                        handleChatSelect={handleChatSelect}
                        togglePinChat={togglePinChat}
                      />
                      <Space m="lg" />
                    </>
                  )}
                  {Object.keys(groupedChats.older).map((monthYear) => (
                    <div key={monthYear}>
                      <Text c="dimmed" size="sm" p={8} fw={500}>
                        {monthYear}
                      </Text>
                      <MenuChatList
                        chats={groupedChats.older[monthYear]}
                        editingChatId={editingChatId}
                        newChatName={newChatName}
                        handleInputChange={handleInputChange}
                        handleInputBlur={handleInputBlur}
                        handleInputKeyPress={handleInputKeyPress}
                        handleInputClick={handleInputClick}
                        startEditing={startEditing}
                        openDeleteModal={openDeleteModal}
                        handleChatSelect={handleChatSelect}
                        togglePinChat={togglePinChat}
                      />
                      <Space m="lg" />
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea.Autosize>
          </Stack>
          <Box style={{ borderTop: '1px solid var(--drawer-border-color)' }}>
            <NavLink
              label="Settings"
              fw={500}
              autoContrast
              leftSection={<IconSettings size="1rem" />}
            />
            <NavLink
              label="Feedback"
              fw={500}
              leftSection={<IconMessageReport size="1rem" />}
              onClick={goToFeedback}
            />
            <NavLink
              label="Sign Out"
              fw={500}
              leftSection={<IconLogout size="1rem" />}
              onClick={logout}
            />
          </Box>
        </Box>
      </Drawer>
      <Modal
        data-theme={isDark ? 'dark' : 'light'} // Set data-theme attribute
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title={
          <Group>
            <ThemeIcon variant="light" color="red" size="xl" radius="xl">
              <IconAlertTriangleFilled />
            </ThemeIcon>
            <Title order={4} fw={600}>
              Confirm Deletion
            </Title>
          </Group>
        }
        radius="lg"
        centered
      >
        <Text px={6} mt="md">
          Are you sure you want to delete this chat? This action cannot be undone.
        </Text>
        <Divider my="md" />
        <Group justify="flex-end" mt="md">
          <Button variant="outline" fw={500} onClick={() => setDeleteModalOpened(false)}>
            Cancel
          </Button>
          <Button color="red" fw={500} onClick={handleDeleteChat}>
            Delete
          </Button>
        </Group>
      </Modal>
    </>
  );
};

export default SideDrawer;
