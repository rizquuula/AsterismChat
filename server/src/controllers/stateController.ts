import { Request, Response } from 'express';
import { stateService } from '../services/stateService';
import logger from '../utils/logger';

/**
 * State Controller - Handles HTTP request/response for state operations
 */
export const stateController = {
  /**
   * GET /state - Get full state
   */
  async getFullState(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const startTime = Date.now();

    try {
      logger.debug('Fetching full state', { requestId, operation: 'getState' });

      const state = await stateService.getFullState();

      const duration = Date.now() - startTime;
      logger.info('State fetched', {
        requestId,
        operation: 'getState',
        duration,
        details: {
          agents: state.agents.length,
          groups: state.groups.length,
          messages: state.messages.length,
          sessionId: state.sessionId,
        },
      });

      res.json({ success: true, data: state });
    } catch (error) {
      logger.error('Failed to fetch state', {
        requestId,
        operation: 'getState',
        error: error as Error,
      });
      res.status(500).json({ success: false, error: 'Failed to fetch state' });
    }
  },

  /**
   * POST /state - Save full state
   */
  async saveFullState(req: Request, res: Response) {
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
          activeGroupId,
        },
      });

      const result = await stateService.saveFullState({
        agents,
        groups,
        messages,
        activeGroupId,
        sessionId,
      });

      const duration = Date.now() - startTime;
      logger.info('State saved', {
        requestId,
        operation: 'saveState',
        duration,
        details: {
          ...result,
          sessionId,
          activeGroupId,
        },
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to save state', {
        requestId,
        operation: 'saveState',
        error: error as Error,
        details: { sessionId },
      });
      res.status(500).json({ success: false, error: 'Failed to save state' });
    }
  },

  /**
   * PATCH /state/active-group - Update active group
   */
  async updateActiveGroup(req: Request, res: Response) {
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

      await stateService.updateActiveGroup(sessionId, activeGroupId || null);

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
  },
};