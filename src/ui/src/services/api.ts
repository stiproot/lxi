import {
  AIResponse,
  Chat,
  ChatMessage,
  File,
  FileContent,
  QueryAiAgentRequest,
  ReadmeResponse,
  Repository,
  User,
} from '../types';
import { HttpClient } from './http.client';
import { getMockFileContent, getMockRepositoryReadme } from './mockApi';

const isDevelopment = import.meta.env.MODE === 'development';
const httpClient = new HttpClient();

export const getRepositories = async () => {
  const response = await httpClient.get<Repository[]>('/api/repositories');

  // Ensure repositories have a valid status
  return response.map((repo) => ({
    ...repo,
    // If no status is set, default to NotStarted rather than null
    embeddingStatus: repo.embeddingStatus || 'NotStarted',
  }));
};

export const getRepositoryReadme = async (repoName: string): Promise<ReadmeResponse> => {
  if (isDevelopment) {
    const response = await getMockRepositoryReadme(repoName);
    return response.data;
  }
  return httpClient.get<ReadmeResponse>(`/api/repositories/${repoName}/files/README.md`);
};

export const getRepositoryFiles = (repoName: string) => {
  return httpClient.get<File[]>(`/api/repositories/${repoName}/files`);
};

export const getFileContent = (repoName: string, filePath: string) => {
  return isDevelopment
    ? getMockFileContent(repoName, filePath)
    : httpClient.get<FileContent>(`/api/repositories/${repoName}/files/${filePath}`);
};

export const startEmbeddingProcess = (repo: Repository) => {
  return httpClient.post<void>(`/api/repositories/embed`, repo);
};

export const getMockAiResponse = async (
  message: string
): Promise<{ data: { response: string } }> => {
  // Simulate a delay to mimic an actual API call
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return a mock response
  return {
    data: {
      response: `This is a mock response to your message: "${message}"`,
    },
  };
};

export const queryAiAgent = async (
  message: string,
  repositoryName: string,
  chatId: string,
  options?: { signal?: AbortSignal }
): Promise<AIResponse> => {
  const requestPayload: QueryAiAgentRequest = {
    repoName: repositoryName,
    chatId,
    query: message,
  };

  return await httpClient.post<AIResponse>(
    '/api/ai/agent/query',
    requestPayload,
    {},
    options?.signal
  );
};

export const getChatInfo = (chatId: string) => {
  return httpClient.get<Chat>(`/api/chats/${chatId}`);
};

export const getChatMessage = (chatId: string, messageId: string) => {
  return httpClient.get<ChatMessage>(`/api/chats/${chatId}/messages/${messageId}`);
};

export const addChatMessage = (chatId: string, message: ChatMessage) => {
  return httpClient.post<ChatMessage>(`/api/chats/${chatId}/messages`, message);
};

export const deleteChatMessage = (chatId: string, messageId: string) => {
  return httpClient.delete<void>(`/api/chats/${chatId}/messages/${messageId}`);
};

export const getAllChats = () => {
  return httpClient.get<Chat[]>('/api/chats');
};

export const createNewChat = (chat: Chat) => {
  return httpClient.post<Chat>('/api/chats', chat);
};

export const deleteChat = (chatId: string) => {
  return httpClient.delete<void>(`/api/chats/${chatId}`);
};

export const renameChat = (chatId: string, newName: string) => {
  return httpClient.put<void>(`/api/chats/${chatId}/rename`, { newName });
};

export const pinChat = (chatId: string, pin: boolean) => {
  return httpClient.put<void>(`/api/chats/${chatId}/pin`, { pin });
};

export const addChatParticipant = (chatId: string, participantId: string) => {
  return httpClient.post<void>(`/api/chats/${chatId}/participants/${participantId}`);
};

export const removeChatParticipant = (chatId: string, participantId: string) => {
  return httpClient.delete<void>(`/api/chats/${chatId}/participants/${participantId}`);
};

export const updateChatRepository = (chatId: string, repositoryName: string) => {
  return httpClient.put<void>(`/api/chats/${chatId}/repository`, { repositoryName });
};

export const getChatRepository = (chatId: string) => {
  return httpClient.get<string>(`/api/chats/${chatId}/repository`);
};

export const searchUsers = (query: string) => {
  return httpClient.get<User[]>(`/api/user/search?q=${query}`);
};

export const getCurrentUser = () => {
  return httpClient.get<User>('/api/user/me');
};

export const getUserById = (userId: string) => {
  return httpClient.get<User>(`/api/user/${userId}`);
};

export const getRepositoryStatus = async (repoName: string) => {
  return httpClient.get<{ status: string }>(`/api/repositories/${repoName}/status`);
};

export const checkEmbeddingStatus = async (repoNames: string[]) => {
  // Ensure unique repository names before sending the request
  const uniqueRepoNames = [...new Set(repoNames)];
  return httpClient.post<Record<string, string>>('/api/repositories/status', {
    repoNames: uniqueRepoNames,
  });
};
