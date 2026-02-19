import { Router } from 'express';
import prisma from '../db/client';
import logger from '../utils/logger';

const router = Router();

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