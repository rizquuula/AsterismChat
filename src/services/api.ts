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

// Session API
export async function createSession(
  groupId: string
): Promise<ApiResponse<{ sessionId: string; groupId: string }>> {
  return fetchApi<{ sessionId: string; groupId: string }>('/api/v1/session', {
    method: 'POST',
    body: JSON.stringify({ groupId }),
  });
}

export async function getSession(
  sessionId: string
): Promise<ApiResponse<{ sessionId: string; activeGroupId: string | null }>> {
  return fetchApi<{ sessionId: string; activeGroupId: string | null }>(`/api/v1/session/${sessionId}`);
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
  agentIds: string[]
): Promise<ApiResponse<Group>> {
  return fetchApi<Group>('/api/v1/groups', {
    method: 'POST',
    body: JSON.stringify({ name, agentIds }),
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
  groupId?: string
): Promise<ApiResponse<Message[]>> {
  const query = groupId ? `?groupId=${encodeURIComponent(groupId)}` : '';
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
  return fetchApi<void>(`/api/v1/messages/clear/session?sessionId=${encodeURIComponent(sessionId)}`, {
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
