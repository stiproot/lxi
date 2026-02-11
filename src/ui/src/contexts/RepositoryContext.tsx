import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { logger } from '@/services/logger';
import { NotificationService } from '@/services/notificationService';
import { signalRService } from '@/services/signalRService';
import { Repository } from '@/types';
import {
  checkEmbeddingStatus,
  getRepositories,
  getRepositoryStatus,
  startEmbeddingProcess,
} from '../services/api';
import { authEvents, AuthService } from '../services/auth/auth.service';

// Types
interface RepositoryState {
  repositories: Repository[];
  isLoading: boolean;
  error: string | null;
  isConnected: boolean;
}

interface RepositoryContextType extends RepositoryState {
  refreshRepositories: () => Promise<void>;
  startEmbedding: (repoName: string) => Promise<void>;
}

// Context
const RepositoryContext = createContext<RepositoryContextType | undefined>(undefined);

// Provider Component
export const RepositoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<RepositoryState>({
    repositories: [],
    isLoading: true,
    error: null,
    isConnected: false,
  });
  const [isInitialized, setIsInitialized] = useState(false);

  const cacheRepositories = (repositories: Repository[]) => {
    localStorage.setItem(
      'repositoryCache',
      JSON.stringify({
        data: repositories,
        timestamp: Date.now(),
      })
    );
  };

  const getCachedRepositories = () => {
    const cache = localStorage.getItem('repositoryCache');
    if (!cache) {
      return null;
    }

    const { data, timestamp } = JSON.parse(cache);
    const isCacheValid = Date.now() - timestamp < 24 * 60 * 60 * 1000;
    return isCacheValid && Array.isArray(data) ? data : null;
  };

  // Fetch repositories with initial status
  const fetchRepositories = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
    }

    try {
      const response = await getRepositories();

      // Get status for all repositories
      const statusResponse = await checkEmbeddingStatus(response.map((repo) => repo.name));

      // Create a map for quick status lookups
      const statusMap = new Map(Object.entries(statusResponse));

      // Merge status with repository data
      const reposWithStatus = response.map((repo) => ({
        ...repo,
        embeddingStatus: statusMap.get(repo.name) || 'NotStarted',
      }));

      // Cache the full repository objects including their status
      cacheRepositories(reposWithStatus);

      setState((prev) => ({
        ...prev,
        repositories: reposWithStatus,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch repositories';
      setState((prev) => ({ ...prev, error: message, isLoading: false }));
      NotificationService.showError(message);
    }
  }, []);

  // Update repository status through WebSocket updates
  const updateRepositoryStatus = useCallback((repositoryName: string, status: string) => {
    setState((prev) => {
      const newRepositories = prev.repositories.map((repo) =>
        repo.name === repositoryName ? { ...repo, embeddingStatus: status } : repo
      );

      // Update cache when status changes
      const cache = localStorage.getItem('repositoryCache');
      if (cache) {
        const { timestamp } = JSON.parse(cache);
        localStorage.setItem(
          'repositoryCache',
          JSON.stringify({
            data: newRepositories,
            timestamp,
          })
        );
      }

      return {
        ...prev,
        repositories: newRepositories,
      };
    });
  }, []);

  // Add a new method to sync a single repository status
  const syncRepositoryStatus = useCallback(
    async (repoName: string) => {
      try {
        const { status } = await getRepositoryStatus(repoName);
        updateRepositoryStatus(repoName, status);
      } catch (error) {
        console.error(`Failed to sync status for repository ${repoName}:`, error);
      }
    },
    [updateRepositoryStatus]
  );

  // Start embedding process
  const startEmbedding = useCallback(
    async (repoName: string) => {
      const repository = state.repositories.find((r) => r.name === repoName);
      if (
        repository?.embeddingStatus === 'Success' ||
        repository?.embeddingStatus === 'InProgress'
      ) {
        return;
      }

      try {
        await startEmbeddingProcess(repository!);
        // Sync status after starting embedding
        await syncRepositoryStatus(repoName);
      } catch (error) {
        updateRepositoryStatus(repoName, 'Error');
        NotificationService.showRepositoryStatus('Error', `Failed to start embedding ${repoName}`);
      }
    },
    [state.repositories, updateRepositoryStatus, syncRepositoryStatus]
  );

  // Initialize SignalR connection for real-time updates
  useEffect(() => {
    const auth = new AuthService();
    if (!auth.isAuthenticated()) {
      return;
    }

    const setupConnection = async () => {
      try {
        await signalRService.startConnection();
        setState((prev) => ({ ...prev, isConnected: true }));

        // Handle embedding status updates via WebSocket
        return signalRService.onEmbeddingStatusChanged((repoName, status, message) => {
          updateRepositoryStatus(repoName, status);
          NotificationService.showRepositoryStatus(status, message);
        });
      } catch (error) {
        setState((prev) => ({ ...prev, isConnected: false }));
        logger.error('SignalR connection error:', error);
      }
    };

    const cleanup = setupConnection();
    return () => {
      cleanup.then((unsubscribe) => unsubscribe?.());
    };
  }, [updateRepositoryStatus]);

  // Add auth state listener
  useEffect(() => {
    const handleLogin = () => {
      logger.debug('Auth login detected, loading repositories');
      setIsInitialized(false); // Reset initialization
      loadInitialData();
    };

    authEvents.on('login', handleLogin);
    return () => {
      authEvents.off('login', handleLogin);
    };
  }, []);

  const loadInitialData = useCallback(async () => {
    if (isInitialized) {
      return;
    }

    const auth = new AuthService();
    if (!auth.isAuthenticated()) {
      setState({
        repositories: [],
        isLoading: false,
        error: null,
        isConnected: false,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true }));

    try {
      const cached = getCachedRepositories();
      if (cached) {
        logger.debug('Valid repository cache found, skipping fetch');
        setState((prev) => ({
          ...prev,
          repositories: cached,
          isLoading: false,
        }));
        setIsInitialized(true);
        return;
      }
      await fetchRepositories(true);
      setIsInitialized(true);
    } catch (error) {
      logger.error('Error loading repositories:', error);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load repositories',
      }));
    }
  }, [fetchRepositories, isInitialized]);

  // Update initial load effect to use the new loadInitialData function
  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const contextValue: RepositoryContextType = {
    ...state,
    refreshRepositories: fetchRepositories,
    startEmbedding,
  };

  return <RepositoryContext.Provider value={contextValue}>{children}</RepositoryContext.Provider>;
};

// Hook
export const useRepositoryContext = () => {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepositoryContext must be used within RepositoryProvider');
  }
  return context;
};
