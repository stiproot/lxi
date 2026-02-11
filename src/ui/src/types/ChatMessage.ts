export interface ChatMessage {
  id: string;
  chatId: string;
  sender: string;
  content: string;
  timestamp: string;
  type?: 'repository_change' | 'text' | 'ai'; // Update type property with all message types
}
