import prisma from '../db/client';
import { Agent, Usage } from '../types';
import { formatAgent } from '../utils/formatters';
import logger from '../utils/logger';

interface AgentApiResponse {
  content: string;
  usage?: Usage;
}

/**
 * Agent Service - Business logic for agent operations
 */
export const agentsService = {
  /**
   * Get all agents
   */
  async findAll(): Promise<Agent[]> {
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return agents.map(formatAgent);
  },

  /**
   * Get agent by ID
   */
  async findById(id: string): Promise<Agent | null> {
    const agent = await prisma.agent.findUnique({ where: { id } });
    return agent ? formatAgent(agent) : null;
  },

  /**
   * Create a new agent
   */
  async create(data: {
    name: string;
    endpoint: string;
    model: string;
    apiKey: string;
    settings?: any;
  }): Promise<Agent> {
    const agent = await prisma.agent.create({
      data: {
        name: data.name,
        endpoint: data.endpoint,
        model: data.model,
        apiKey: data.apiKey,
        createdAt: BigInt(Date.now()),
        settings: data.settings || {},
      },
    });
    return formatAgent(agent);
  },

  /**
   * Update an agent
   */
  async update(
    id: string,
    data: {
      name?: string;
      endpoint?: string;
      model?: string;
      apiKey?: string;
      settings?: any;
      lastResponseAt?: number;
    }
  ): Promise<Agent | null> {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.endpoint !== undefined) updateData.endpoint = data.endpoint;
    if (data.model !== undefined) updateData.model = data.model;
    if (data.apiKey !== undefined) updateData.apiKey = data.apiKey;
    if (data.settings !== undefined) updateData.settings = data.settings;
    if (data.lastResponseAt !== undefined)
      updateData.lastResponseAt = BigInt(data.lastResponseAt);

    const agent = await prisma.agent.update({
      where: { id },
      data: updateData,
    });
    return formatAgent(agent);
  },

  /**
   * Delete an agent
   */
  async delete(id: string): Promise<void> {
    await prisma.agent.delete({ where: { id } });
  },

  /**
   * Call an agent API with the given message
   */
  async callAgent(
    agentId: string,
    sessionId: string,
    userMessage: string
  ): Promise<AgentApiResponse> {
    // Fetch agent from database
    const agent = await this.findById(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    const settings = agent.settings;
    const timeout = settings.timeout ?? 30000;
    const maxRetries = settings.maxRetries ?? 3;
    const retryDelay = settings.retryDelay ?? 1000;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

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
          signal: controller.signal,
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

        const data = await response.json() as any;
        const content = data.choices?.[0]?.message?.content || 'No response';
        const usage = data.usage;

        // Update agent's lastResponseAt
        await this.update(agentId, { lastResponseAt: Date.now() });

        logger.debug('Agent API call successful', {
          operation: 'callAgent',
          details: { agentId, sessionId, attempt },
        });

        return { content, usage };

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on abort (unless it's our timeout)
        if (lastError.name === 'AbortError') {
          if (attempt < maxRetries) {
            await sleep(retryDelay * (attempt + 1)); // Exponential backoff
            continue;
          }
          throw new Error('Request timed out');
        }

        // Don't retry on client errors
        if (lastError.message.includes('HTTP 4')) {
          throw lastError;
        }

        // Retry on network errors, server errors, or timeout
        if (attempt < maxRetries) {
          logger.warn('Agent API call failed, retrying', {
            operation: 'callAgent',
            details: { agentId, sessionId, attempt, maxRetries, error: lastError.message },
          });
          // Exponential backoff
          await sleep(retryDelay * Math.pow(2, attempt));
        }
      }
    }

    throw new Error(lastError?.message || 'Max retries reached');
  },
};

// Helper function for sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
