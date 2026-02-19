import { Router } from 'express';
import prisma from '../db/client';
import logger from '../utils/logger';

const router = Router();

/**
 * PATCH /session/active-group - Update active group for a session
 */
router.patch('/active-group', async (req, res) => {
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
      details: { sessionId, activeGroupId },
    });

    // Check if session exists
    const existingSession = await prisma.session.findUnique({ where: { id: sessionId } });
    
    if (existingSession) {
      // Update existing session
      await prisma.session.update({
        where: { id: sessionId },
        data: { activeGroupId: activeGroupId || null },
      });
    } else {
      // Create new session with active group
      await prisma.session.create({
        data: {
          id: sessionId,
          activeGroupId: activeGroupId || null,
          createdAt: BigInt(Date.now()),
        },
      });
    }

    logger.info('Active group updated', {
      requestId,
      operation: 'updateActiveGroup',
      details: { sessionId, activeGroupId },
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to update active group', {
      requestId,
      operation: 'updateActiveGroup',
      error: error as Error,
      details: { sessionId },
    });
    res.status(500).json({ success: false, error: 'Failed to update active group' });
  }
});

export default router;