export interface AgentSettings {
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  enabled: boolean;
  autoResponse: boolean;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Agent {
  id: string;
  name: string;
  endpoint: string;
  model: string;
  apiKey: string;
  createdAt: number;
  lastResponseAt?: number;
  settings: AgentSettings;
}

export interface Group {
  id: string;
  name: string;
  agentIds: string[];
  createdAt: number;
}

export interface Message {
  id: string;
  sessionId: string;
  content: string;
  sender: string;
  senderName: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'error';
  targets?: string[];
  error?: string;
  usage?: Usage;
}

export interface ChatState {
  agents: Agent[];
  groups: Group[];
  messages: Message[];
  activeGroupId: string | null;
  sessionId: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface StateResponse {
  agents: Agent[];
  groups: Group[];
  messages: Message[];
  activeGroupId: string | null;
  sessionId: string;
}