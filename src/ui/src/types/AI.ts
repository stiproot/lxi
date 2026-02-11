export interface QueryAiAgentRequest {
  repoName: string;
  query: string;
  chatId: string;
}

export interface AIResponse {
  output: string; // Make sure this matches the backend response
}

export interface AIMessage {
  id: string;
  chatId: string;
  sender: 'ai';
  content: string;
  timestamp: string;
  type?: string;
}
