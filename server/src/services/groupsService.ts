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
  }): Promise<Group> {
    // First create the group
    const group = await prisma.group.create({
      data: {
        name: data.name,
        createdAt: BigInt(Date.now()),
      },
    });

    // Then create GroupAgent records if agentIds are provided
    if (data.agentIds && data.agentIds.length > 0) {
      await prisma.groupAgent.createMany({
        data: data.agentIds.map((agentId) => ({
          groupId: group.id,
          agentId,
        })),
      });
    }

    // Fetch the group with agents
    const groupWithAgents = await prisma.group.findUnique({
      where: { id: group.id },
      include: {
        agents: true,
      },
    });

    return formatGroupWithAgents(groupWithAgents!, groupWithAgents!.agents);
  },

  /**
   * Update a group
   */
  async update(
    id: string,
    data: {
      name?: string;
      agentIds?: string[];
    }
  ): Promise<Group | null> {
    // Update group basic info
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;

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