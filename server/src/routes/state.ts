import { Router, Request, Response } from 'express';
import prisma from '../db/client';
import { ChatState, Agent, Group, Message } from '../types';

const router = Router();

// Helper functions
async function formatGroup(group: any): Promise<Group> {
  const groupAgents = await prisma.groupAgent.findMany({
    where: { groupId: group.id },
  });

  return {
    id: group.id,
    name: group.name,
    sessionId: group.sessionId,
    createdAt: Number(group.createdAt),
    agentIds: groupAgents.map((ga) => ga.agentId),
  };
}

function formatAgent(agent: any): Agent {
  return {
    id: agent.id,
    name: agent.name,
    endpoint: agent.endpoint,
    model: agent.model,
    apiKey: agent.apiKey,
    createdAt: Number(agent.createdAt),
    lastResponseAt: agent.lastResponseAt ? Number(agent.lastResponseAt) : undefined,
    settings: agent.settings as Agent['settings'],
  };
}

function formatMessage(message: any): Message {
  return {
    id: message.id,
    sessionId: message.sessionId,
    groupId: message.groupId,
    content: message.content,
    sender: message.sender,
    senderName: message.senderName,
    timestamp: Number(message.timestamp),
    status: message.status as Message['status'],
    targets: message.targets as string[] | undefined,
    error: message.error || undefined,
  };
}

// Get full state
router.get('/', async (req: Request, res: Response) => {
  try {
    // Get all agents
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // Get all groups
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
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

    const formattedState: ChatState = {
      agents: agents.map(formatAgent),
      groups: await Promise.all(groups.map(formatGroup)),
      messages: messages.map(formatMessage),
      activeGroupId: session.activeGroupId || null,
      sessionId: session.id,
    };

    res.json({ success: true, data: formattedState });
  } catch (error) {
    console.error('Error fetching state:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch state' });
  }
});

// Save full state (upsert all data)
router.post('/', async (req: Request, res: Response) => {
  try {
    const { agents, groups, messages, activeGroupId, sessionId } = req.body;

    // Start transaction
    await prisma.$transaction(async (tx) => {
      // Update or create session
      if (sessionId) {
        const existingSession = await tx.session.findUnique({ where: { id: sessionId } });
        if (existingSession) {
          await tx.session.update({
            where: { id: sessionId },
            data: { activeGroupId: activeGroupId || null },
          });
        } else {
          await tx.session.create({
            data: {
              id: sessionId,
              activeGroupId: activeGroupId || null,
              createdAt: BigInt(Date.now()),
            },
          });
        }
      }

      // Sync agents
      if (agents && Array.isArray(agents)) {
        for (const agent of agents) {
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
          }
        }
      }

      // Sync groups
      if (groups && Array.isArray(groups)) {
        for (const group of groups) {
          const existingGroup = await tx.group.findUnique({ where: { id: group.id } });
          if (existingGroup) {
            await tx.group.update({
              where: { id: group.id },
              data: {
                name: group.name,
                sessionId: group.sessionId,
              },
            });
          } else {
            await tx.group.create({
              data: {
                id: group.id,
                name: group.name,
                sessionId: group.sessionId,
                createdAt: BigInt(group.createdAt),
              },
            });
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
      if (messages && Array.isArray(messages)) {
        for (const message of messages) {
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
              },
            });
          }
        }
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving state:', error);
    res.status(500).json({ success: false, error: 'Failed to save state' });
  }
});

// Update active group
router.patch('/active-group', async (req: Request, res: Response) => {
  try {
    const { activeGroupId, sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId is required' });
    }

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (session) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { activeGroupId: activeGroupId || null },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating active group:', error);
    res.status(500).json({ success: false, error: 'Failed to update active group' });
  }
});

export default router;