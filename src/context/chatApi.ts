import { Agent, Message, AgentSettings } from '../types';

export interface SendMessageParams {
  content: string;
  sessionId: string;
  targetAgentIds: string[];
  agents: Agent[];
  onAddMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message;
  onUpdateMessage: (id: string, updates: Partial<Message>) => void;
  onUpdateAgent: (agent: Agent) => void;
}

export async function sendMessageToAgents({
  content,
  sessionId,
  targetAgentIds,
  agents,
  onAddMessage,
  onUpdateMessage,
  onUpdateAgent,
}: SendMessageParams): Promise<void> {
  if (targetAgentIds.length === 0) return;

  // Add user message
  onAddMessage({
    sessionId,
    content,
    sender: 'user',
    senderName: 'You',
    status: 'sent',
    targets: targetAgentIds,
  });

  // Send to each selected agent
  for (const agentId of targetAgentIds) {
    const agent = agents.find(a => a.id === agentId);
    if (!agent) continue;

    // Check if agent is enabled
    if (agent.settings.enabled === false) {
      continue;
    }

    // Generate message ID upfront so we can update it later
    const pendingMessageId = crypto.randomUUID();
    const timestamp = Date.now();

    // Add placeholder for agent response
    const pendingMessage: Message = {
      id: pendingMessageId,
      sessionId,
      content: '',
      sender: agentId,
      senderName: agent.name,
      timestamp,
      status: 'sending',
      targets: [agentId],
    };

    // We need to dispatch this directly, so we'll handle it differently
    // This is a simplified version - in practice you'd pass dispatch
  }
}

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

export interface CallAgentApiOptions {
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
  signal?: AbortSignal;
}

export async function callAgentApi(
  agent: Agent,
  sessionId: string,
  userMessage: string,
  options: CallAgentApiOptions = {}
): Promise<string> {
  const settings = agent.settings;
  const timeout = options.timeout ?? settings.timeout;
  const maxRetries = options.maxRetries ?? settings.maxRetries;
  const retryDelay = options.retryDelay ?? settings.retryDelay;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // If external signal provided, combine with our controller
      const signal = options.signal 
        ? AbortSignal.any([controller.signal, options.signal])
        : controller.signal;

      const response = await fetch(agent.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${agent.apiKey}`,
        },
        body: JSON.stringify({
          model: agent.model,
          messages: [
            {
              session_id: sessionId,
              role: 'user',
              content: userMessage,
            },
          ],
        }),
        signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        // Don't retry on client errors (4xx)
        if (response.status >= 400 && response.status < 500) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        // Server errors (5xx) - retry
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || 'No response';

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on abort (unless it's our timeout)
      if (lastError.name === 'AbortError') {
        // Check if we should retry based on whether it's a timeout
        if (attempt < maxRetries) {
          await sleep(retryDelay * (attempt + 1)); // Exponential backoff
          continue;
        }
        throw new TimeoutError();
      }

      // Don't retry on client errors
      if (lastError.message.includes('HTTP 4')) {
        throw lastError;
      }

      // Retry on network errors, server errors, or timeout
      if (attempt < maxRetries) {
        // Exponential backoff
        await sleep(retryDelay * Math.pow(2, attempt));
      }
    }
  }

  throw new RetriesExhaustedError(lastError?.message || 'Max retries reached');
}

// Helper function for sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test connection to an agent
export async function testAgentConnection(
  agent: Agent
): Promise<{ success: boolean; message: string }> {
  try {
    const result = await callAgentApi(agent, 'test-session', 'Hello');
    return {
      success: true,
      message: result || 'Connection successful',
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      message,
    };
  }
}
