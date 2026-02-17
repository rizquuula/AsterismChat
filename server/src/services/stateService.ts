import prisma from '../db/client';
import { ChatState } from '../types';
import { formatAgent, formatGroupWithAgents, formatMessage } from '../utils/formatters';

/**
 * State Service - Business logic for state operations
 */
export const stateService = {
  /**
   * Get full state (agents, groups, messages, session)
   */
  async getFullState(): Promise<ChatState> {
    // Get all agents
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Get all groups with agents included
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        agents: true,
      },
    });

    // Get all messages
    const messages = await prisma.message.findMany({
      orderBy: { timestamp: 'asc' },
    });

    // Get or create session
    let session = await prisma.session.findFirst();
    if (!session) {
      session = await prisma.session.create({
        data: {
          id: crypto.randomUUID(),
          createdAt: BigInt(Date.now()),
        },
      });
    }

    return {
      agents: agents.map(formatAgent),
      groups: groups.map((g) => formatGroupWithAgents(g, g.agents)),
      messages: messages.map(formatMessage),
      activeGroupId: session.activeGroupId || null,
      sessionId: session.id,
    };
  },

  /**
   * Save full state (upsert all data)
   */
  async saveFullState(data: {
    agents?: any[];
    groups?: any[];
    messages?: any[];
    activeGroupId?: string | null;
    sessionId?: string;
  }): Promise<{
    agentsCreated: number;
    agentsUpdated: number;
    groupsCreated: number;
    groupsUpdated: number;
    messagesCreated: number;
    messagesUpdated: number;
    messagesSkipped: number;
  }> {
    let agentsCreated = 0;
    let agentsUpdated = 0;
    let groupsCreated = 0;
    let groupsUpdated = 0;
    let messagesCreated = 0;
    let messagesUpdated = 0;
    let messagesSkipped = 0;

    await prisma.$transaction(async (tx) => {
      // Update or create session
      if (data.sessionId) {
        const existingSession = await tx.session.findUnique({ where: { id: data.sessionId } });
        if (existingSession) {
          await tx.session.update({
            where: { id: data.sessionId },
            data: { activeGroupId: data.activeGroupId || null },
          });
        } else {
          await tx.session.create({
            data: {
              id: data.sessionId,
              activeGroupId: data.activeGroupId || null,
              createdAt: BigInt(Date.now()),
            },
          });
        }
      }

      // Sync agents
      if (data.agents && Array.isArray(data.agents)) {
        for (const agent of data.agents) {
          const existingAgent = await tx.agent.findUnique({ where: { id: agent.id } });
          if (existingAgent) {
            await tx.agent.update({
              where: { id: agent.id },
              data: {
                name: agent.name,
                endpoint: agent.endpoint,
                model: agent.model,
                apiKey: agent.apiKey,
                lastResponseAt: agent.lastResponseAt ? BigInt(agent.lastResponseAt) : null,
                settings: agent.settings,
              },
            });
            agentsUpdated++;
          } else {
            await tx.agent.create({
              data: {
                id: agent.id,
                name: agent.name,
                endpoint: agent.endpoint,
                model: agent.model,
                apiKey: agent.apiKey,
                createdAt: BigInt(agent.createdAt),
                lastResponseAt: agent.lastResponseAt ? BigInt(agent.lastResponseAt) : null,
                settings: agent.settings,
              },
            });
            agentsCreated++;
          }
        }
      }

      // Sync groups
      if (data.groups && Array.isArray(data.groups)) {
        for (const group of data.groups) {
          const existingGroup = await tx.group.findUnique({ where: { id: group.id } });
          if (existingGroup) {
            await tx.group.update({
              where: { id: group.id },
              data: {
                name: group.name,
                sessionId: group.sessionId,
              },
            });
            groupsUpdated++;
          } else {
            await tx.group.create({
              data: {
                id: group.id,
                name: group.name,
                sessionId: group.sessionId,
                createdAt: BigInt(group.createdAt),
              },
            });
            groupsCreated++;
          }

          // Update group agents
          await tx.groupAgent.deleteMany({ where: { groupId: group.id } });
          if (group.agentIds && group.agentIds.length > 0) {
            await tx.groupAgent.createMany({
              data: group.agentIds.map((agentId: string) => ({
                groupId: group.id,
                agentId,
              })),
            });
          }
        }
      }

      // Sync messages
      if (data.messages && Array.isArray(data.messages)) {
        // Get all valid group IDs from the database
        const validGroups = await tx.group.findMany({ select: { id: true } });
        const validGroupIds = new Set(validGroups.map((g) => g.id));

        for (const message of data.messages) {
          // Skip messages with invalid groupId (group doesn't exist)
          if (message.groupId && !validGroupIds.has(message.groupId)) {
            messagesSkipped++;
            continue;
          }

          const existingMessage = await tx.message.findUnique({ where: { id: message.id } });
          if (!existingMessage) {
            await tx.message.create({
              data: {
                id: message.id,
                sessionId: message.sessionId,
                groupId: message.groupId,
                content: message.content,
                sender: message.sender,
                senderName: message.senderName,
                timestamp: BigInt(message.timestamp),
                status: message.status,
                targets: message.targets || null,
                error: message.error || null,
                usage: message.usage || null,
              },
            });
            messagesCreated++;
          } else {
            // Update existing message
            const hasContentChanged = existingMessage.content !== message.content;
            const hasStatusChanged = existingMessage.status !== message.status;
            const hasErrorChanged = existingMessage.error !== (message.error || null);
            const hasUsageChanged = JSON.stringify(existingMessage.usage) !== JSON.stringify(message.usage || null);

            if (hasContentChanged || hasStatusChanged || hasErrorChanged || hasUsageChanged) {
              await tx.message.update({
                where: { id: message.id },
                data: {
                  content: message.content,
                  status: message.status,
                  error: message.error || null,
                  usage: message.usage || null,
                },
              });
              messagesUpdated++;
            }
          }
        }
      }
    });

    return {
      agentsCreated,
      agentsUpdated,
      groupsCreated,
      groupsUpdated,
      messagesCreated,
      messagesUpdated,
      messagesSkipped,
    };
  },

  /**
   * Update active group
   */
  async updateActiveGroup(sessionId: string, activeGroupId: string | null): Promise<void> {
    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (session) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { activeGroupId: activeGroupId || null },
      });
    }
  },
};