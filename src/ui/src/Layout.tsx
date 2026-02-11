// src/Layout.tsx
import React, { useEffect, useRef, useState } from 'react';
import { IconCode, IconEdit, IconLayoutSidebar, IconMessageCircle } from '@tabler/icons-react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  ActionIcon,
  AppShell,
  Avatar,
  Group,
  Indicator,
  Tooltip,
  useMantineColorScheme,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import AppLogo from './assets/app-icon.svg?react';
import Logo from './assets/lxi-name-logo.svg?react';
import { ParticipantManager } from './components/ParticipantManager/ParticipantManager';
import SideDrawer from './components/SideDrawer/SideDrawer';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import { useChatContext } from './contexts/ChatContext';
import { useUserContext } from './contexts/UserContext'; // Import User type

import { ConnectionStatus, signalRService } from './services/signalRService';
import classes from './Layout.module.css';

const Layout: React.FC = () => {
  const { colorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const { user, loading, error, fetchUser } = useUserContext();
  const { createChat, currentChatId, participantStatuses, chatMessages } = useChatContext();

  const [chatHubStatus, setChatHubStatus] = useState<ConnectionStatus>('disconnected');
  const [repoHubStatus, setRepoHubStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    const updateHubStatuses = () => {
      setChatHubStatus(signalRService.getChatHubStatus());
      setRepoHubStatus(signalRService.getRepoHubStatus());
    };

    // Initial status update
    updateHubStatuses();

    // Setup connection listener
    const unsubscribeConnection = signalRService.onConnectionChange(() => {
      updateHubStatuses();
    });

    // Periodically check connection status to ensure UI is in sync
    const statusInterval = setInterval(updateHubStatuses, 5000);

    return () => {
      unsubscribeConnection();
      clearInterval(statusInterval);
    };
  }, []);

  useEffect(() => {
    const handleMouseEnterMainContent = (event: MouseEvent) => {
      if (mainContentRef.current?.contains(event.target as Node)) {
        closeDrawer();
      }
    };

    mainContentRef.current?.addEventListener('mouseenter', handleMouseEnterMainContent);

    return () => {
      mainContentRef.current?.removeEventListener('mouseenter', handleMouseEnterMainContent);
    };
  }, [closeDrawer]);

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleAvatarClick = () => {
    navigate('/profile');
  };

  const handleNewChatClick = async () => {
    try {
      // const newChatName = `Chat ${chats.length + 1}`;
      const newChat = await createChat();
      navigate(`/chat/${newChat.id}`);
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
  };

  return (
    <AppShell
      data-theme={isDark ? 'dark' : 'light'}
      header={{ height: 60 }}
      padding="md"
      classNames={classes}
    >
      <AppShell.Header
        withBorder={false}
        style={{ backgroundColor: 'transparent', padding: '12px 16px' }}
      >
        <Group h="100%" gap={12} align="center" className={classes.headerGroup}>
          <Logo
            className={classes.logo}
            style={{ height: '40px', width: '40px', cursor: 'pointer' }}
            onClick={handleLogoClick}
          />
          <Group gap="sm" className={classes.themeToggleGroup}>
            {currentChatId && chatMessages.length === 0 && (
              <div className={classes.participantsWrapper}>
                <ParticipantManager chatId={currentChatId} />
              </div>
            )}
            <Tooltip label="New Chat" withArrow>
              <ActionIcon
                variant="transparent"
                color="gray.6"
                size={32}
                radius="md"
                onClick={handleNewChatClick}
                className={classes.newChatButton}
                aria-label="Create New Chat"
              >
                <IconEdit size={24} />
              </ActionIcon>
            </Tooltip>
            <ThemeToggle />
            {loading ? (
              <Avatar radius="xl" size={32} className={classes.avatar} />
            ) : error ? (
              <Tooltip label="Error loading user" withArrow>
                <Avatar radius="xl" size={32} className={classes.avatar} />
              </Tooltip>
            ) : (
              <Tooltip label={user?.name} withArrow>
                <Indicator
                  size={12}
                  color={participantStatuses[user?.id || ''] === 'online' ? 'green' : 'red'}
                  offset={5}
                  withBorder
                  inline
                >
                  <Avatar
                    name={user?.name}
                    radius="xl"
                    size={32}
                    className={classes.avatar}
                    onClick={handleAvatarClick}
                    aria-label="User Profile"
                  />
                </Indicator>
              </Tooltip>
            )}
          </Group>
        </Group>
        <Logo
          className={classes.stationaryLogo}
          style={{ height: '40px', width: '40px', cursor: 'pointer' }}
          onClick={handleLogoClick}
        />
      </AppShell.Header>
      <SideDrawer opened={drawerOpened} onClose={closeDrawer} />
      <AppShell.Main ref={mainContentRef} data-theme={isDark ? 'dark' : 'light'}>
        <Outlet />
      </AppShell.Main>
      <div className={classes.hoverArea} onMouseEnter={openDrawer} />
      <IconLayoutSidebar size={24} className={classes.bottomIcon} onClick={openDrawer} />
      {/* Wrap ChatHub and RepositoryStatusHub Indicators in a container */}
      <div className={classes.footerIcons}>
        <Tooltip
          label={`Chat Hub - ${chatHubStatus.charAt(0).toUpperCase() + chatHubStatus.slice(1)}`}
          position="top"
          withArrow
        >
          <Indicator
            size={12}
            color={
              chatHubStatus === 'connected'
                ? 'green'
                : chatHubStatus === 'connecting'
                  ? 'yellow'
                  : 'red'
            }
            processing={chatHubStatus === 'connecting'}
            offset={5}
            withBorder
            inline
            className={classes.connectionStatus}
          >
            <IconMessageCircle size={24} style={{ color: 'var(--icon-color)', opacity: 0.7 }} />
          </Indicator>
        </Tooltip>
        <Tooltip
          label={`Repository Hub - ${repoHubStatus.charAt(0).toUpperCase() + repoHubStatus.slice(1)}`}
          position="top"
          withArrow
        >
          <Indicator
            size={12}
            color={
              repoHubStatus === 'connected'
                ? 'green'
                : repoHubStatus === 'connecting'
                  ? 'yellow'
                  : 'red'
            }
            processing={repoHubStatus === 'connecting'}
            offset={5}
            withBorder
            inline
            className={classes.connectionStatus}
          >
            <IconCode size={24} style={{ color: 'var(--icon-color)', opacity: 0.7 }} />
          </Indicator>
        </Tooltip>
        <AppLogo width={24} height={24} className={classes.logoIcon} />
      </div>
    </AppShell>
  );
};

export default Layout;
