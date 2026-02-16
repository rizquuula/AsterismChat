export interface Agent {
  id: string;
  name: string;
  endpoint: string;
  model: string;
  apiKey: string;
  createdAt: number;
  lastResponseAt?: number;
}

export interface Message {
  id: string;
  sessionId: string;
  content: string;
  sender: 'user' | Agent['id'];
  senderName: string;
  timestamp: number;
  status: 'sending' | 'sent' | 'error';
  targets?: string[];
  error?: string;
}

export interface ChatState {
  agents: Agent[];
  messages: Message[];
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
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<Message> } }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'LOAD_STATE'; payload: ChatState };