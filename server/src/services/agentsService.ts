import prisma from '../db/client';
import { Agent } from '../types';
import { formatAgent } from '../utils/formatters';

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
};