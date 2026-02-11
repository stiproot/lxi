import * as signalR from '@microsoft/signalr';
import { notifications } from '@mantine/notifications';
import { logger } from '@/services/logger'; // Ensure a logger service is implemented and imported
import { ChatMessage } from '../types';
import { AuthService } from './auth/auth.service';

const RECONNECT_INTERVALS = [0, 2000, 5000, 10000, 20000];

const BASE_URL =
  window.location.hostname === 'localhost'
    ? 'http://localhost:5000'
    : 'http://lxi.aicodegen-devtest.privatelink.northeurope.azmk8s.io/lxi/ui-api/v1';

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';
export type { ConnectionStatus };

type ConnectionCallback = (status: ConnectionStatus) => void;

class SignalRService {
  private authService: AuthService;
  private chatHubConnection: signalR.HubConnection | null = null;
  private repoHubConnection: signalR.HubConnection | null = null;
  private messageCallbacks: ((message: ChatMessage) => void)[] = [];
  private onlineCallbacks: ((userId: string) => void)[] = [];
  private offlineCallbacks: ((userId: string) => void)[] = [];
  private aiTypingCallbacks: ((chatId: string, isTyping: boolean) => void)[] = [];
  private embeddingStatusCallbacks: ((
    repositoryId: string,
    status: string,
    message: string
  ) => void)[] = [];
  private participantAddedCallbacks: ((chatId: string, participantId: string) => void)[] = [];
  private currentChatId: string | null = null;
  private connectionCallbacks: ConnectionCallback[] = [];
  private isConnecting: boolean = false; // Add this line
  private isInitialConnection: boolean = true; // Add this line
  private chatHubStatus: ConnectionStatus = 'disconnected';
  private repoHubStatus: ConnectionStatus = 'disconnected';
  private userStatus: Record<string, 'online' | 'offline'> = {}; // Add this line
  private repositoryChangeCallbacks: ((
    chatId: string,
    repoName: string,
    changedBy: string
  ) => void)[] = [];

  constructor() {
    this.authService = new AuthService();
  }

  public getChatHubStatus(): ConnectionStatus {
    return this.chatHubStatus;
  }

  public getRepoHubStatus(): ConnectionStatus {
    return this.repoHubStatus;
  }

  public getUserStatus(userId: string): 'online' | 'offline' {
    return this.userStatus[userId] || 'offline';
  }

  private updateUserStatus(userId: string, status: 'online' | 'offline') {
    const currentStatus = this.userStatus[userId];
    // Only update and notify if the status is actually changing
    if (currentStatus !== status) {
      this.userStatus[userId] = status;
      // Only trigger callbacks if we're not in initial connection
      if (!this.isInitialConnection) {
        if (status === 'online') {
          this.onlineCallbacks.forEach((cb) => cb(userId));
        } else {
          this.offlineCallbacks.forEach((cb) => cb(userId));
        }
      }
    }
  }

  private async setupHub(
    connection: signalR.HubConnection | null,
    hubName: string,
    handlers: { [key: string]: (...args: any[]) => void }
  ) {
    if (!(await this.authService.getAccessToken())) {
      logger.warn(`[SignalR] No auth token available for ${hubName} hub`);
      this.updateHubStatus(hubName.toLowerCase(), 'disconnected');
      return null;
    }

    if (connection?.state === signalR.HubConnectionState.Connected) {
      logger.info(`[SignalR] ${hubName} hub already connected`);
      return connection;
    }

    try {
      logger.info(`[SignalR] Setting up ${hubName} hub...`);
      this.notifyConnectionChange('connecting', hubName);

      const newConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${BASE_URL}/${hubName}Hub`, {
          accessTokenFactory: async () => {
            const token = await this.authService.getAccessToken();
            return token?.raw || '';
          },
        })
        .withHubProtocol(new signalR.JsonHubProtocol())
        .withAutomaticReconnect(RECONNECT_INTERVALS)
        .configureLogging(signalR.LogLevel.Warning) // Removed to disable SignalR console logging
        .build();

      // Remove existing handlers to prevent duplicates
      Object.keys(handlers).forEach((event) => {
        newConnection.off(event);
      });

      // Register all handlers
      Object.entries(handlers).forEach(([event, handler]) => {
        newConnection.on(event, handler);
      });

      // Register user status handlers
      newConnection.on('UserOnline', (userId) => this.updateUserStatus(userId, 'online'));
      newConnection.on('UserOffline', (userId) => this.updateUserStatus(userId, 'offline'));

      // Remove any existing repository change handlers
      newConnection.off('RepositoryChanged');

      // Add AI typing handler if this is the chat hub
      if (hubName === 'chat') {
        // Register AI typing handler directly rather than recursively calling setupHub
        newConnection.off('AiTypingStatus'); // Remove any existing handler first
        newConnection.on('AiTypingStatus', (chatId: string, isTyping: boolean) =>
          this.aiTypingCallbacks.forEach((cb) => cb(chatId, isTyping))
        );
      }

      // Add repository change handler
      if (hubName === 'chat') {
        newConnection.on(
          'RepositoryChanged',
          (chatId: string, repoName: string, changedBy: string) => {
            // Ensure callbacks exist before invoking them
            if (this.repositoryChangeCallbacks.length > 0) {
              this.repositoryChangeCallbacks.forEach((cb) => cb(chatId, repoName, changedBy));
            }
          }
        );
      }

      // Setup connection lifecycle handlers
      this.setupConnectionLifecycle(newConnection, hubName);

      await this.connectHub(newConnection, hubName);
      return newConnection;
    } catch (error) {
      logger.error(`[SignalR] Failed to setup ${hubName} hub:`, error);
      this.notifyConnectionChange('disconnected', hubName);
      throw error;
    }
  }

  private updateHubStatus(hubName: string, status: ConnectionStatus) {
    const prevStatus = hubName === 'chat' ? this.chatHubStatus : this.repoHubStatus;

    if (hubName === 'chat') {
      this.chatHubStatus = status;
    } else if (hubName === 'repositorystatus') {
      this.repoHubStatus = status;
    }

    // Only notify if status actually changed
    if (prevStatus !== status) {
      // Only show notifications if we're past initial connection
      if (!this.isInitialConnection || status === 'connected') {
        this.showConnectionNotification(hubName, status);
      }

      // Notify subscribers of the status change
      this.connectionCallbacks.forEach((callback) => callback(status));
    }
  }

  private showConnectionNotification(hubName: string, status: ConnectionStatus) {
    // Only show notifications for error states (disconnected)
    if (status === 'disconnected' && !this.isInitialConnection) {
      notifications.show({
        title: 'Connection Error',
        message: `${hubName} hub disconnected - attempting to reconnect`,
        color: 'red',
        autoClose: 3000,
      });
    }

    // Still update initial connection state if needed
    if (this.isInitialConnection && status === 'connected') {
      this.isInitialConnection = false;
    }
  }

  private setupConnectionLifecycle(connection: signalR.HubConnection, hubName: string) {
    const normalizedHubName = hubName.toLowerCase();

    connection.onreconnecting(() => {
      logger.warn(`[SignalR] ${hubName} reconnecting...`);
      this.updateHubStatus(normalizedHubName, 'connecting');
      this.clearUserStatuses(); // Add this line
    });

    connection.onreconnected(() => {
      logger.info(`[SignalR] ${hubName} reconnected`);
      this.updateHubStatus(normalizedHubName, 'connected');
    });

    connection.onclose(() => {
      logger.error(`[SignalR] ${hubName} closed`);
      this.updateHubStatus(normalizedHubName, 'disconnected');
      this.clearUserStatuses();
    });
  }

  public async startConnection() {
    if (this.isConnecting) {
      // Wait for existing connection attempt
      await new Promise((resolve) => {
        const checkConnection = setInterval(() => {
          if (!this.isConnecting) {
            clearInterval(checkConnection);
            resolve(true);
          }
        }, 100);
      });
      return;
    }

    // Add check for authentication
    if (!this.authService.isAuthenticated()) {
      logger.warn('[SignalR] User not authenticated - deferring connection');
      return;
    }

    try {
      await this.authService.ensureTokensAreValid();
    } catch (error) {
      logger.error('[SignalR] Token validation failed:', error);
      return;
    }

    if (
      this.chatHubConnection?.state === signalR.HubConnectionState.Connected &&
      this.repoHubConnection?.state === signalR.HubConnectionState.Connected
    ) {
      // Update statuses even if already connected
      this.updateHubStatus('chat', 'connected');
      this.updateHubStatus('repositorystatus', 'connected');
      logger.warn('[SignalR] Connections are already established');
      return;
    }

    this.isConnecting = true;

    try {
      // Setup chat hub
      this.chatHubConnection = await this.setupHub(this.chatHubConnection, 'chat', {
        ReceiveMessage: (message) => this.messageCallbacks.forEach((cb) => cb(message)),
        UserOnline: (userId) => this.onlineCallbacks.forEach((cb) => cb(userId)),
        UserOffline: (userId) => this.offlineCallbacks.forEach((cb) => cb(userId)),
        ParticipantAdded: (chatId, participantId) =>
          this.participantAddedCallbacks.forEach((cb) => cb(chatId, participantId)),
      });

      // Setup repository hub with empty handlers - events will be handled through callbacks
      this.repoHubConnection = await this.setupHub(this.repoHubConnection, 'repositoryStatus', {});

      // Register embedding status handler after connection
      if (this.repoHubConnection) {
        this.repoHubConnection.on(
          'EmbeddingStatusChanged',
          (repositoryId: string, status: string, message: string) => {
            // Forward event to callbacks
            this.embeddingStatusCallbacks.forEach((cb) => cb(repositoryId, status, message));
          }
        );
      }

      // Explicitly update status after successful connection
      this.updateHubStatus('chat', 'connected');
      this.updateHubStatus('repositorystatus', 'connected');

      logger.info('[SignalR] All hubs connected successfully');
    } catch (error) {
      logger.error('[SignalR] Error during connection:', error);
      this.updateHubStatus('chat', 'disconnected');
      this.updateHubStatus('repositorystatus', 'disconnected');
    } finally {
      this.isConnecting = false;
    }
  }

  // Add method to wait for connection
  public async waitForConnection(timeout = 5000): Promise<boolean> {
    if (this.chatHubConnection?.state === signalR.HubConnectionState.Connected) {
      return true;
    }

    return new Promise((resolve) => {
      const start = Date.now();
      const checkConnection = setInterval(() => {
        if (this.chatHubConnection?.state === signalR.HubConnectionState.Connected) {
          clearInterval(checkConnection);
          resolve(true);
        } else if (Date.now() - start > timeout) {
          clearInterval(checkConnection);
          resolve(false);
        }
      }, 100);
    });
  }

  private async connectHub(connection: signalR.HubConnection, hubName: string) {
    const normalizedHubName = hubName.toLowerCase();
    try {
      logger.info(`[SignalR] Connecting ${hubName} hub...`);
      this.updateHubStatus(normalizedHubName, 'connecting');
      await connection.start();
      logger.info(`[SignalR] ${hubName} hub connected successfully`);
      this.updateHubStatus(normalizedHubName, 'connected');
    } catch (err) {
      logger.error(`[SignalR] Error connecting ${hubName} hub:`, err);
      this.updateHubStatus(normalizedHubName, 'disconnected');
      throw err;
    }
  }

  public async disconnect() {
    try {
      if (this.repoHubConnection?.state === signalR.HubConnectionState.Connected) {
        logger.info('[SignalR] Stopping repository hub connection...');
        await this.repoHubConnection.stop();
        logger.info('[SignalR] Repository hub disconnected');
      }
      if (this.chatHubConnection?.state === signalR.HubConnectionState.Connected) {
        logger.info('[SignalR] Stopping chat hub connection...');
        await this.chatHubConnection.stop();
        logger.info('[SignalR] Chat hub disconnected');
      }
      this.clearUserStatuses(); // Add this line
    } catch (error) {
      logger.error('[SignalR] Error during disconnect:', error);
    }
  }

  private setupHubReconnection(connection: signalR.HubConnection | null, hubName: string) {
    if (!connection) {
      return;
    }

    const normalizedHubName = hubName.toLowerCase();

    connection.onreconnecting((error) => {
      logger.warn(`Attempting to reconnect ${hubName}:`, error);
      this.updateHubStatus(normalizedHubName, 'connecting');
    });

    connection.onreconnected(async (connectionId) => {
      logger.info(`${hubName} Reconnected with ID:`, connectionId);
      this.updateHubStatus(normalizedHubName, 'connected');

      // For chat hub, rejoin room if needed
      if (hubName === 'Chat' && this.currentChatId) {
        try {
          await this.joinChat(this.currentChatId);
        } catch (err) {
          logger.error('Error rejoining chat after reconnection:', err);
        }
      }
    });

    connection.onclose((error) => {
      logger.error(`${hubName} Connection closed:`, error);
      this.updateHubStatus(normalizedHubName, 'disconnected');
      setTimeout(() => this.startConnection(), 5000);
    });
  }

  // Update chat methods to use chatHubConnection
  public async joinChat(chatId: string) {
    // Add retries for joinChat
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        if (this.chatHubConnection?.state === signalR.HubConnectionState.Connected) {
          await this.chatHubConnection.invoke('JoinChat', chatId);
          this.currentChatId = chatId;
          return;
        }

        if (i < maxRetries - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          await this.startConnection();
        }
      } catch (error) {
        if (i === maxRetries - 1) {
          throw error;
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  public async leaveChat(chatId: string) {
    if (this.chatHubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.chatHubConnection.invoke('LeaveChat', chatId);
      } catch (error) {
        logger.error('[SignalR] Error leaving chat:', error);
      }
      this.currentChatId = null;
    }
  }

  public onMessage(callback: (message: ChatMessage) => void) {
    this.messageCallbacks.push(callback);
    return () => {
      this.messageCallbacks = this.messageCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onUserOnline(callback: (userId: string) => void) {
    this.onlineCallbacks.push(callback);
    return () => {
      this.onlineCallbacks = this.onlineCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onUserOffline(callback: (userId: string) => void) {
    this.offlineCallbacks.push(callback);
    return () => {
      this.offlineCallbacks = this.offlineCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onParticipantAdded(callback: (chatId: string, participantId: string) => void) {
    this.chatHubConnection?.on('ParticipantAdded', callback);
    return () => {
      this.chatHubConnection?.off('ParticipantAdded', callback);
    };
  }

  public onEmbeddingStatusChanged(
    callback: (repositoryId: string, status: string, message: string) => void
  ) {
    this.embeddingStatusCallbacks.push(callback);
    return () => {
      this.embeddingStatusCallbacks = this.embeddingStatusCallbacks.filter((cb) => cb !== callback);
    };
  }

  public onAiTypingStatus(callback: (chatId: string, isTyping: boolean) => void) {
    this.aiTypingCallbacks.push(callback);
    return () => {
      this.aiTypingCallbacks = this.aiTypingCallbacks.filter((cb) => cb !== callback);
    };
  }

  public async notifyAiTyping(chatId: string, isTyping: boolean) {
    if (this.chatHubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.chatHubConnection.invoke('BroadcastAiTyping', chatId, isTyping);
      } catch (error) {
        logger.error('[SignalR] Error notifying AI typing:', error);
      }
    }
  }

  public onConnectionChange(callback: ConnectionCallback) {
    this.connectionCallbacks.push(callback);
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter((cb) => cb !== callback);
    };
  }

  public offConnectionChange() {
    this.connectionCallbacks = [];
  }

  private notifyConnectionChange(status: ConnectionStatus, hubName: string) {
    // Simply update the hub status without showing notifications
    const normalizedHubName = hubName.toLowerCase();
    if (normalizedHubName === 'chat') {
      this.chatHubStatus = status;
    } else if (normalizedHubName === 'repositorystatus') {
      this.repoHubStatus = status;
    }

    // Notify subscribers of the status change
    this.connectionCallbacks.forEach((callback) => callback(status));
  }

  private clearUserStatuses() {
    this.userStatus = {};
  }

  public cleanup() {
    this.disconnect();
    this.clearUserStatuses(); // Add this line
    this.messageCallbacks = [];
    this.onlineCallbacks = [];
    this.offlineCallbacks = [];
    this.embeddingStatusCallbacks = [];
    this.participantAddedCallbacks = [];
    this.connectionCallbacks = [];
    this.aiTypingCallbacks = [];
  }

  // Add method to subscribe to repository changes
  public onRepositoryChange(
    callback: (chatId: string, repoName: string, changedBy: string) => void
  ) {
    // Add callback if it doesn't already exist
    if (!this.repositoryChangeCallbacks.includes(callback)) {
      this.repositoryChangeCallbacks.push(callback);
    }
    return () => {
      this.repositoryChangeCallbacks = this.repositoryChangeCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  public async sendUserMessage(chatId: string, message: ChatMessage, repositoryName?: string) {
    if (this.chatHubConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.chatHubConnection.invoke('SendUserMessage', chatId, message, repositoryName);
      } catch (error) {
        logger.error('[SignalR] Error sending user message:', error);
        throw error;
      }
    } else {
      throw new Error('Chat hub not connected');
    }
  }
}

export const signalRService = new SignalRService();
