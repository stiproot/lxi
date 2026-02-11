import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  IconAlertCircle,
  IconCircleCheck,
  IconProgressDown,
  IconRefresh,
  IconSearch,
  IconSelector,
} from '@tabler/icons-react';
import { debounce } from 'lodash';
import { useLocation, useNavigate } from 'react-router-dom';
import { ActionIcon, CloseButton, Group, Loader, Text, useMantineColorScheme } from '@mantine/core';
import { Spotlight, spotlight, SpotlightActionData } from '@mantine/spotlight';
import { NotificationService } from '@/services/notificationService';
import GitIcon from '../../assets/git-repository-svgrepo-com.svg?react';
import { useChatContext } from '../../contexts/ChatContext';
import { useRepositoryContext } from '../../contexts/RepositoryContext';
import { signalRService } from '../../services/signalRService';
import classes from './RepoSpotlight.module.css';

const getStatusIcon = (embeddingStatus: string | null) => {
  switch (embeddingStatus) {
    case 'Success':
      return <IconCircleCheck size={22} className={classes.successIcon} />;
    case 'InProgress':
      return (
        <div className={classes.spinnerWrapper}>
          <Loader size="sm" color="blue" className={classes.statusSpinner} />
        </div>
      );
    case 'Error':
      return <IconAlertCircle size={22} className={classes.errorIcon} />;
    case 'NotStarted':
    case null:
      return <IconProgressDown size={22} className={classes.pendingIcon} />;
    default:
      return <IconProgressDown size={22} className={classes.pendingIcon} />;
  }
};

interface RepoSpotlightProps {
  selectedRepo: string;
  setSelectedRepo: (value: string) => void;
}

const RepoSpotlight: React.FC<RepoSpotlightProps> = ({ selectedRepo, setSelectedRepo }) => {
  const location = useLocation();
  const { colorScheme } = useMantineColorScheme();
  const navigate = useNavigate();
  const isDark = colorScheme === 'dark';
  const [value, setValue] = useState<string>(() => {
    return localStorage.getItem('selectedRepo') || selectedRepo || '';
  });
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearch = useMemo(() => debounce((query) => setSearchQuery(query), 300), []);

  const handleSearchChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(event.target.value);
    },
    [debouncedSearch]
  );

  const { repositories, isLoading, error, refreshRepositories, startEmbedding } =
    useRepositoryContext();
  const { chats, currentChatId, getCurrentRepository, updateRepository, createChat } =
    useChatContext();

  const filteredRepoOptions = useMemo(
    () =>
      repositories.filter((repo) => repo.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [repositories, searchQuery]
  );

  const handleRepoSelection = useCallback(
    async (repo: { id: string; name: string }) => {
      const chatId = location.pathname.split('/chat/')[1];
      try {
        spotlight.close();

        // Update local state
        setValue(repo.name);
        setSelectedRepo(repo.name);
        localStorage.setItem('selectedRepo', repo.name);

        // Handle chat creation/navigation
        const activeChatId = chatId || (await createChat()).id;
        if (!chatId) {
          navigate(`/chat/${activeChatId}`);
          await new Promise((resolve) => setTimeout(resolve, 100));
        }

        // Update repository
        await updateRepository(activeChatId, repo.name);

        // Check if embedding is needed
        const repository = repositories.find((r) => r.id === repo.name);
        if (
          repository?.embeddingStatus !== 'Success' &&
          repository?.embeddingStatus !== 'InProgress'
        ) {
          await startEmbedding(repo.name);
        }
      } catch (err) {
        console.error('Error in handleRepoSelection:', err);
        NotificationService.showError('Error updating repository');
      }
    },
    [repositories, createChat, navigate, setSelectedRepo, startEmbedding, updateRepository]
  );

  const actions: SpotlightActionData[] = filteredRepoOptions.map((repo) => ({
    id: repo.name,
    label: repo.name,
    onClick: () => handleRepoSelection(repo),
    rightSection: (
      <div className={classes.statusWrapper}>{getStatusIcon(repo.embeddingStatus)}</div>
    ),
  }));

  useEffect(() => {
    const syncRepository = async () => {
      if (currentChatId) {
        try {
          const currentRepo = await getCurrentRepository(currentChatId);
          if (currentRepo && currentRepo !== value) {
            setValue(currentRepo);
            setSelectedRepo(currentRepo);
            localStorage.setItem('selectedRepo', currentRepo);
          }
        } catch (err) {
          if (!(err instanceof Error && err.message.includes('404'))) {
            console.error('Error syncing repository:', err);
          }
        }
      }
    };

    syncRepository();
  }, [currentChatId, value, setSelectedRepo, getCurrentRepository]);

  useEffect(() => {
    const unsubscribe = signalRService.onRepositoryChange((chatId, repoName) => {
      if (chatId === currentChatId && repoName !== value) {
        setValue(repoName);
        setSelectedRepo(repoName);
        localStorage.setItem('selectedRepo', repoName);
      }
    });

    return () => unsubscribe();
  }, [currentChatId, value, setSelectedRepo]);

  const selectedRepoStatus =
    repositories.find((repo) => repo.name === value)?.embeddingStatus ?? null;

  return (
    <>
      <Group
        role="button"
        tabIndex={0}
        data-theme={isDark ? 'dark' : 'light'}
        className={classes.repoSpotlightButton}
        onClick={() => spotlight.open()}
        onKeyUp={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            spotlight.open();
          }
        }}
        style={{ width: '100%', padding: '8px 16px', cursor: 'pointer' }}
        gap="sm"
      >
        <GitIcon color="var(--icon-color)" width={20} height={20} />
        <Text c="dimmed" style={{ flex: 1 }}>
          {isLoading ? 'Loading repositories...' : value || 'Choose a repository...'}
        </Text>
        {value && !isLoading && getStatusIcon(selectedRepoStatus)}
        {isLoading ? (
          <Loader size="xs" mr={4} />
        ) : error ? (
          <ActionIcon
            onClick={(event) => {
              event.stopPropagation();
              refreshRepositories();
            }}
            aria-label="Retry"
            style={{ backgroundColor: 'transparent' }}
          >
            <IconRefresh size={18} color="var(--icon-color)" />
          </ActionIcon>
        ) : value === '' ? (
          <IconSelector size={20} color="var(--icon-color)" style={{ marginRight: '2px' }} />
        ) : (
          <CloseButton
            size="sm"
            radius="md"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.stopPropagation();
              setValue('');
              setSelectedRepo('');
              localStorage.removeItem('selectedRepo');
            }}
            aria-label="Clear value"
          />
        )}
      </Group>
      <Spotlight
        actions={actions}
        radius="lg"
        data-theme={isDark ? 'dark' : 'light'}
        nothingFound="Nothing found..."
        highlightQuery
        limit={7}
        searchProps={{
          leftSection: <IconSearch style={{ width: 20, height: 20 }} stroke={1.5} />,
          placeholder: 'Search repositories...',
          onChange: handleSearchChange,
        }}
      />
    </>
  );
};

export default RepoSpotlight;
