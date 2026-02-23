import { Router } from 'express';
import prisma from '../db/client';
import logger from '../utils/logger';

const router = Router();

/**
 * GET /session/latest - Get the most recent session with its group and messages
 * Returns the latest session context for stateless client initialization
 */
router.get('/latest', async (req, res) => {
  const requestId = (req as any).requestId;

  try {
    logger.debug('Fetching latest session', { requestId, operation: 'getLatestSession' });

    const latestGroupSession = await prisma.groupSession.findFirst({
      orderBy: { createdAt: 'desc' },
      include: {
        group: {
          include: {
            agents: {
              include: {
                agent: true,
              },
            },
          },
        },
        session: true,
      },
    });

    if (!latestGroupSession) {
      logger.info('No sessions found', { requestId, operation: 'getLatestSession' });
      return res.json({ success: true, data: null });
    }

    const messages = await prisma.message.findMany({
      where: { sessionId: latestGroupSession.sessionId },
      orderBy: { timestamp: 'asc' },
    });

    const agentIds = latestGroupSession.group.agents.map(ga => ga.agentId);

    const result = {
      group: {
        id: latestGroupSession.group.id,
        name: latestGroupSession.group.name,
        createdAt: Number(latestGroupSession.group.createdAt),
        agentIds,
      },
      sessionId: latestGroupSession.sessionId,
      messages: messages.map(msg => ({
        id: msg.id,
        sessionId: msg.sessionId,
        content: msg.content,
        sender: msg.sender,
        senderName: msg.senderName,
        timestamp: Number(msg.timestamp),
        status: msg.status,
        targets: msg.targets,
        error: msg.error,
        usage: msg.usage,
      })),
    };

    logger.info('Latest session fetched', {
      requestId,
      operation: 'getLatestSession',
      details: { groupId: result.group.id, sessionId: result.sessionId, messageCount: result.messages.length },
    });

    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('Failed to fetch latest session', {
      requestId,
      operation: 'getLatestSession',
      error: error as Error,
    });
    res.status(500).json({ success: false, error: 'Failed to fetch latest session' });
  }
});

/**
 * POST /session - Create or get a session
 */
router.post('/', async (req, res) => {
  const requestId = (req as any).requestId;
  const { groupId } = req.body;

  try {
    if (!groupId) {
      logger.warn('groupId required for creating session', { requestId, operation: 'createSession' });
      return res.status(400).json({ success: false, error: 'groupId is required' });
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      logger.warn('Group not found', { requestId, operation: 'createSession', details: { groupId } });
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    logger.debug('Creating session', {
      requestId,
      operation: 'createSession',
      details: { groupId },
    });

    // Generate new session ID
    const sessionId = crypto.randomUUID();
    const now = BigInt(Date.now());

    // Create session and groupSession mapping in a transaction
    await prisma.$transaction([
      prisma.session.create({
        data: {
          id: sessionId,
          createdAt: now,
        },
      }),
      prisma.groupSession.create({
        data: {
          group: {
            connect: {
              id: groupId,
            },
          },
          session: {
            connect: {
              id: sessionId,
            },
          },
          createdAt: now,
        },
      }),
    ]);

    logger.info('Session created', {
      requestId,
      operation: 'createSession',
      details: { sessionId, groupId },
    });

    res.json({ success: true, data: { sessionId, groupId } });
  } catch (error) {
    logger.error('Failed to create session', {
      requestId,
      operation: 'createSession',
      error: error as Error,
    });
    res.status(500).json({ success: false, error: 'Failed to create session' });
  }
});

/**
 * GET /session/group/:groupId - Get all sessions for a group, ordered by most recent
 * NOTE: This route must be defined BEFORE /:sessionId to avoid Express matching "group" as a sessionId
 */
router.get('/group/:groupId', async (req, res) => {
  const requestId = (req as any).requestId;
  const { groupId } = req.params;

  try {
    const group = await prisma.group.findUnique({ where: { id: groupId } });
    if (!group) {
      logger.warn('Group not found', { requestId, operation: 'getSessionsByGroup', details: { groupId } });
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    logger.debug('Fetching sessions for group', { requestId, operation: 'getSessionsByGroup', details: { groupId } });

    const groupSessions = await prisma.groupSession.findMany({
      where: { groupId },
      include: {
        session: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const sessions = groupSessions.map(gs => ({
      sessionId: gs.sessionId,
      createdAt: Number(gs.createdAt),
    }));

    logger.info('Sessions fetched for group', {
      requestId,
      operation: 'getSessionsByGroup',
      details: { groupId, count: sessions.length },
    });

    res.json({ success: true, data: sessions });
  } catch (error) {
    logger.error('Failed to fetch sessions for group', {
      requestId,
      operation: 'getSessionsByGroup',
      error: error as Error,
      details: { groupId },
    });
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
});

/**
 * GET /session/:sessionId - Get session by ID
 */
router.get('/:sessionId', async (req, res) => {
  const requestId = (req as any).requestId;
  const { sessionId } = req.params;

  try {
    logger.debug('Fetching session', { requestId, operation: 'getSession', details: { sessionId } });

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        groupSessions: {
          include: {
            group: true,
          },
        },
      },
    });

    if (!session) {
      logger.warn('Session not found', { requestId, operation: 'getSession', details: { sessionId } });
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    // Get the most recent group (if any)
    const latestGroupSession = session.groupSessions[0];
    const activeGroupId = latestGroupSession?.groupId || null;

    logger.info('Session fetched', {
      requestId,
      operation: 'getSession',
      details: { sessionId, activeGroupId },
    });

    res.json({ success: true, data: { sessionId, activeGroupId } });
  } catch (error) {
    logger.error('Failed to fetch session', {
      requestId,
      operation: 'getSession',
      error: error as Error,
      details: { sessionId },
    });
    res.status(500).json({ success: false, error: 'Failed to fetch session' });
  }
});

export default router;
