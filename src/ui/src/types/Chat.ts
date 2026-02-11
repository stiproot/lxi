import { ChatMessage } from './ChatMessage';

export interface Chat {
  id: string;
  name: string;
  ownerId: string;
  participantIds: string[];
  messages: ChatMessage[];
  timestamp: string;
  isPinned: boolean;
  lastModified: string;
  currentRepository?: string; // Add this
  lastRepositoryChange?: string; // Add this
}
