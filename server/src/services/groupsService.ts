import prisma from '../db/client';
import { Group } from '../types';
import { formatGroupWithAgents } from '../utils/formatters';

/**
 * Group Service - Business logic for group operations
 */
export const groupsService = {
  /**
   * Get all groups (with agents included to avoid N+1)
   */
  async findAll(): Promise<Group[]> {
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agents: true,
      },
    });
    return groups.map((group) => formatGroupWithAgents(group, group.agents));
  },

  /**
   * Get group by ID
   */
  async findById(id: string): Promise<Group | null> {
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        agents: true,
      },
    });
    return group ? formatGroupWithAgents(group, group.agents) : null;
  },

  /**
   * Create a new group
   */
  async create(data: {
    name: string;
    agentIds?: string[];
    sessionId?: string;
  }): Promise<Group> {
    const sessionId = data.sessionId || crypto.randomUUID();

    const group = await prisma.group.create({
      data: {
        name: data.name,
        sessionId,
        createdAt: BigInt(Date.now()),
        ...(data.agentIds && data.agentIds.length > 0
          ? {
              groupAgents: {
                create: data.agentIds.map((agentId) => ({
                  agentId,
                })),
              },
            }
          : {}),
      },
      include: {
        agents: true,
      },
    });

    return formatGroupWithAgents(group, group.agents);
  },

  /**
   * Update a group
   */
  async update(
    id: string,
    data: {
      name?: string;
      agentIds?: string[];
      sessionId?: string;
    }
  ): Promise<Group | null> {
    // Update group basic info
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.sessionId !== undefined) updateData.sessionId = data.sessionId;

    const group = await prisma.group.update({
      where: { id },
      data: updateData,
    });

    // Update agent associations if provided
    if (data.agentIds !== undefined) {
      await prisma.groupAgent.deleteMany({ where: { groupId: id } });

      if (data.agentIds.length > 0) {
        await prisma.groupAgent.createMany({
          data: data.agentIds.map((agentId) => ({
            groupId: id,
            agentId,
          })),
        });
      }
    }

    // Fetch updated group with agents
    const updatedGroup = await prisma.group.findUnique({
      where: { id },
      include: {
        agents: true,
      },
    });

    return updatedGroup ? formatGroupWithAgents(updatedGroup, updatedGroup.agents) : null;
  },

  /**
   * Delete a group
   */
  async delete(id: string): Promise<void> {
    await prisma.group.delete({ where: { id } });
  },
};