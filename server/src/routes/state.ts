import { Router, Request, Response } from 'express';
import prisma from '../db/client';
import { ChatState, Agent, Group, Message } from '../types';
import logger from '../utils/logger';

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
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    logger.debug('Fetching full state', { requestId, operation: 'getState' });

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
      logger.debug('Creating new session', { requestId, operation: 'getState' });
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

    const duration = Date.now() - startTime;
    logger.info('State fetched', { 
      requestId, 
      operation: 'getState', 
      duration,
      details: { 
        agents: formattedState.agents.length, 
        groups: formattedState.groups.length, 
        messages: formattedState.messages.length,
        sessionId: formattedState.sessionId
      }
    });

    res.json({ success: true, data: formattedState });
  } catch (error) {
    logger.error('Failed to fetch state', { 
      requestId, 
      operation: 'getState',
      error: error as Error 
    });
    res.status(500).json({ success: false, error: 'Failed to fetch state' });
  }
});

// Save full state (upsert all data)
router.post('/', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  const { agents, groups, messages, activeGroupId, sessionId } = req.body;
  
  try {
    logger.debug('Saving full state', { 
      requestId, 
      operation: 'saveState',
      details: { 
        agents: agents?.length, 
        groups: groups?.length, 
        messages: messages?.length,
        sessionId,
        activeGroupId
      }
    });

    let agentsCreated = 0;
    let agentsUpdated = 0;
    let groupsCreated = 0;
    let groupsUpdated = 0;
    let messagesCreated = 0;
    let messagesUpdated = 0;
    let messagesSkipped = 0;

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
          logger.debug('Session updated', { requestId, operation: 'saveState', details: { sessionId } });
        } else {
          await tx.session.create({
            data: {
              id: sessionId,
              activeGroupId: activeGroupId || null,
              createdAt: BigInt(Date.now()),
            },
          });
          logger.debug('Session created', { requestId, operation: 'saveState', details: { sessionId } });
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
      if (messages && Array.isArray(messages)) {
        // Get all valid group IDs from the database
        const validGroups = await tx.group.findMany({ select: { id: true } });
        const validGroupIds = new Set(validGroups.map(g => g.id));
        
        for (const message of messages) {
          // Skip messages with invalid groupId (group doesn't exist)
          if (message.groupId && !validGroupIds.has(message.groupId)) {
            logger.warn('Skipping message with invalid groupId', { 
              requestId, 
              operation: 'saveState',
              details: { messageId: message.id, invalidGroupId: message.groupId }
            });
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
              },
            });
            messagesCreated++;
          } else {
            // Update existing message - this handles cases where message was created with empty content
            // (e.g., "sending" status) and later updated with actual content (e.g., "sent" status)
            const hasContentChanged = existingMessage.content !== message.content;
            const hasStatusChanged = existingMessage.status !== message.status;
            const hasErrorChanged = existingMessage.error !== (message.error || null);
            
            if (hasContentChanged || hasStatusChanged || hasErrorChanged) {
              await tx.message.update({
                where: { id: message.id },
                data: {
                  content: message.content,
                  status: message.status,
                  error: message.error || null,
                },
              });
              messagesUpdated++;
            }
          }
        }
      }
    });

    const duration = Date.now() - startTime;
    logger.info('State saved', { 
      requestId, 
      operation: 'saveState', 
      duration,
      details: { 
        agentsCreated, 
        agentsUpdated, 
        groupsCreated, 
        groupsUpdated, 
        messagesCreated, 
        messagesUpdated,
        messagesSkipped,
        sessionId,
        activeGroupId
      }
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to save state', { 
      requestId, 
      operation: 'saveState',
      error: error as Error,
      details: { sessionId }
    });
    res.status(500).json({ success: false, error: 'Failed to save state' });
  }
});

// Update active group
router.patch('/active-group', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { activeGroupId, sessionId } = req.body;
  
  try {
    if (!sessionId) {
      logger.warn('sessionId required for updating active group', { requestId, operation: 'updateActiveGroup' });
      return res.status(400).json({ success: false, error: 'sessionId is required' });
    }

    logger.debug('Updating active group', { 
      requestId, 
      operation: 'updateActiveGroup',
      details: { sessionId, activeGroupId }
    });

    const session = await prisma.session.findUnique({ where: { id: sessionId } });
    if (session) {
      await prisma.session.update({
        where: { id: sessionId },
        data: { activeGroupId: activeGroupId || null },
      });
    }

    logger.info('Active group updated', { 
      requestId, 
      operation: 'updateActiveGroup',
      details: { sessionId, activeGroupId }
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to update active group', { 
      requestId, 
      operation: 'updateActiveGroup',
      error: error as Error,
      details: { sessionId }
    });
    res.status(500).json({ success: false, error: 'Failed to update active group' });
  }
});

export default router;
