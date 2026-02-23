export interface AgentSettings {
  timeout: number;           // milliseconds (default: 30000)
  maxRetries: number;        // default: 3
  retryDelay: number;        // milliseconds (default: 1000)
  enabled: boolean;          // default: true
  autoResponse: boolean;     // default: true
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

// Default settings for new agents
export const defaultAgentSettings: AgentSettings = {
  timeout: 30000,
  maxRetries: 3,
  retryDelay: 1000,
  enabled: true,
  autoResponse: true,
};

export interface Group {
  id: string;
  name: string;
  agentIds: string[];
  createdAt: number;
}

export interface Usage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface Message {
  id: string;
  sessionId: string;
  content: string;
  sender: 'user' | 'system' | Agent['id'];
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

export interface ApiMessage {
  session_id: string;
  role: 'user';
  content: string;
}

export interface ApiRequestBody {
  model: string;
  messages: ApiMessage[];
}

export interface ApiResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export type ChatAction =
  | { type: 'ADD_AGENT'; payload: Agent }
  | { type: 'UPDATE_AGENT'; payload: Agent }
  | { type: 'DELETE_AGENT'; payload: string }
  | { type: 'ADD_GROUP'; payload: Group }
  | { type: 'UPDATE_GROUP'; payload: Group }
  | { type: 'DELETE_GROUP'; payload: { id: string; sessionId: string; groupId: string } }
  | { type: 'SET_ACTIVE_GROUP'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<Message> } }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'LOAD_STATE'; payload: ChatState };

export interface AsterismAgentInfo {
  name: string;
  version: string;
  description: string;
}

export interface AsterismApiConfig {
  host: string;
  port: number;
  debug: boolean;
  cors_origins: string[];
}

export interface AsterismModelProvider {
  type: string;
  name: string;
  base_url: string;
  api_key: string;
}

export interface AsterismModelsConfig {
  provider: AsterismModelProvider[];
  default: string;
  fallback: string[];
}

export interface AsterismMcpConfig {
  servers_file: string;
  timeout: number;
}

export interface AsterismConfig {
  agent: AsterismAgentInfo;
  api: AsterismApiConfig;
  models: AsterismModelsConfig;
  mcp: AsterismMcpConfig;
}

export type ConfigAction = 'set' | 'append' | 'remove';

export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  description?: string;
  default?: unknown;
  anyOf?: JsonSchema[];
  $ref?: string;
  title?: string;
  enum?: string[];
  $defs?: Record<string, JsonSchema>;
}
