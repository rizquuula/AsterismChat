import { Agent, Group, Message, ChatState, Usage } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface CallAgentResponse {
  content: string;
  usage?: Usage;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
    };
  }
}

// State API
export async function getState(): Promise<ApiResponse<ChatState>> {
  return fetchApi<ChatState>('/api/v1/state');
}

export async function saveState(state: ChatState): Promise<ApiResponse<void>> {
  return fetchApi<void>('/api/v1/state', {
    method: 'POST',
    body: JSON.stringify(state),
  });
}

export async function updateActiveGroup(
  activeGroupId: string | null,
  sessionId: string
): Promise<ApiResponse<void>> {
  return fetchApi<void>('/api/v1/state/active-group', {
    method: 'PATCH',
    body: JSON.stringify({ activeGroupId, sessionId }),
  });
}

// Agents API
export async function getAgents(): Promise<ApiResponse<Agent[]>> {
  return fetchApi<Agent[]>('/api/v1/agents');
}

export async function getAgent(id: string): Promise<ApiResponse<Agent>> {
  return fetchApi<Agent>(`/api/v1/agents/${id}`);
}

export async function createAgent(
  agent: Omit<Agent, 'id' | 'createdAt'>
): Promise<ApiResponse<Agent>> {
  return fetchApi<Agent>('/api/v1/agents', {
    method: 'POST',
    body: JSON.stringify(agent),
  });
}

export async function updateAgent(agent: Agent): Promise<ApiResponse<Agent>> {
  return fetchApi<Agent>(`/api/v1/agents/${agent.id}`, {
    method: 'PUT',
    body: JSON.stringify(agent),
  });
}

export async function deleteAgent(id: string): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/api/v1/agents/${id}`, {
    method: 'DELETE',
  });
}

// Groups API
export async function getGroups(): Promise<ApiResponse<Group[]>> {
  return fetchApi<Group[]>('/api/v1/groups');
}

export async function getGroup(id: string): Promise<ApiResponse<Group>> {
  return fetchApi<Group>(`/api/v1/groups/${id}`);
}

export async function createGroup(
  name: string,
  agentIds: string[],
  sessionId: string
): Promise<ApiResponse<Group>> {
  return fetchApi<Group>('/api/v1/groups', {
    method: 'POST',
    body: JSON.stringify({ name, agentIds, sessionId }),
  });
}

export async function updateGroup(group: Group): Promise<ApiResponse<Group>> {
  return fetchApi<Group>(`/api/v1/groups/${group.id}`, {
    method: 'PUT',
    body: JSON.stringify(group),
  });
}

export async function deleteGroup(id: string): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/api/v1/groups/${id}`, {
    method: 'DELETE',
  });
}

// Messages API
export async function getMessages(
  sessionId?: string
): Promise<ApiResponse<Message[]>> {
  const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
  return fetchApi<Message[]>(`/api/v1/messages${query}`);
}

export async function getMessage(id: string): Promise<ApiResponse<Message>> {
  return fetchApi<Message>(`/api/v1/messages/${id}`);
}

export async function createMessage(
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<ApiResponse<Message>> {
  return fetchApi<Message>('/api/v1/messages', {
    method: 'POST',
    body: JSON.stringify(message),
  });
}

export async function updateMessage(
  id: string,
  updates: Partial<Message>
): Promise<ApiResponse<Message>> {
  return fetchApi<Message>(`/api/v1/messages/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function deleteMessage(id: string): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/api/v1/messages/${id}`, {
    method: 'DELETE',
  });
}

export async function clearMessages(sessionId: string): Promise<ApiResponse<void>> {
  return fetchApi<void>(`/api/v1/messages?sessionId=${encodeURIComponent(sessionId)}`, {
    method: 'DELETE',
  });
}

// Health check
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.ok;
  } catch {
    return false;
  }
}

// Call agent API (server-side)
export async function callAgent(
  agentId: string,
  sessionId: string,
  message: string
): Promise<ApiResponse<CallAgentResponse>> {
  return fetchApi<CallAgentResponse>(`/api/v1/agents/${agentId}/chat`, {
    method: 'POST',
    body: JSON.stringify({ sessionId, message }),
  });
}
