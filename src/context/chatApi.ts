import { Agent, Usage } from '../types';
import { callAgent as serverCallAgent } from '../services/api';

// Custom error class for timeout
export class TimeoutError extends Error {
  constructor(message: string = 'Request timed out') {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Custom error class for retries exhausted
export class RetriesExhaustedError extends Error {
  constructor(message: string = 'Max retries reached') {
    super(message);
    this.name = 'RetriesExhaustedError';
  }
}

export interface AgentApiResponse {
  content: string;
  usage?: Usage;
}

/**
 * Call the agent API through the server (server-side proxy)
 * This moves the AI API call from frontend to backend for security
 */
export async function callAgentApi(
  agent: Agent,
  sessionId: string,
  userMessage: string
): Promise<AgentApiResponse> {
  const response = await serverCallAgent(agent.id, sessionId, userMessage);
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to call agent');
  }
  
  return {
    content: response.data?.content || 'No response',
    usage: response.data?.usage,
  };
}

// Test connection to an agent
export async function testAgentConnection(
  agent: Agent
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await callAgentApi(agent, 'test-session', 'Hello');
    return {
      success: true,
      message: result.content || 'Connection successful',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message,
    };
  }
}
