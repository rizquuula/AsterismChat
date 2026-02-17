import { Request, Response } from 'express';
import { groupsService } from '../services/groupsService';
import logger from '../utils/logger';

/**
 * Group Controller - Handles HTTP request/response for groups
 */
export const groupsController = {
  /**
   * GET /groups - Get all groups
   */
  async getAll(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const startTime = Date.now();

    try {
      logger.debug('Fetching all groups', { requestId, operation: 'getGroups' });

      const groups = await groupsService.findAll();

      const duration = Date.now() - startTime;
      logger.info('Groups fetched', {
        requestId,
        operation: 'getGroups',
        duration,
        details: { count: groups.length },
      });

      res.json({ success: true, data: groups });
    } catch (error) {
      logger.error('Failed to fetch groups', {
        requestId,
        operation: 'getGroups',
        error: error as Error,
      });
      res.status(500).json({ success: false, error: 'Failed to fetch groups' });
    }
  },

  /**
   * GET /groups/:id - Get group by ID
   */
  async getById(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const { id } = req.params;

    try {
      logger.debug('Fetching group', { requestId, operation: 'getGroup', details: { groupId: id } });

      const group = await groupsService.findById(id);

      if (!group) {
        logger.warn('Group not found', { requestId, operation: 'getGroup', details: { groupId: id } });
        return res.status(404).json({ success: false, error: 'Group not found' });
      }

      logger.info('Group fetched', {
        requestId,
        operation: 'getGroup',
        details: { groupId: id, name: group.name, agentCount: group.agentIds.length },
      });

      res.json({ success: true, data: group });
    } catch (error) {
      logger.error('Failed to fetch group', {
        requestId,
        operation: 'getGroup',
        error: error as Error,
        details: { groupId: id },
      });
      res.status(500).json({ success: false, error: 'Failed to fetch group' });
    }
  },

  /**
   * POST /groups - Create a new group
   */
  async create(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const startTime = Date.now();
    const { name, agentIds, sessionId } = req.body;

    try {
      logger.debug('Creating group', {
        requestId,
        operation: 'createGroup',
        details: { name, agentIds: agentIds?.length, sessionId },
      });

      const group = await groupsService.create({ name, agentIds, sessionId });

      const duration = Date.now() - startTime;
      logger.info('Group created', {
        requestId,
        operation: 'createGroup',
        duration,
        details: { groupId: group.id, name: group.name, agentCount: group.agentIds.length },
      });

      res.status(201).json({ success: true, data: group });
    } catch (error) {
      logger.error('Failed to create group', {
        requestId,
        operation: 'createGroup',
        error: error as Error,
        details: { name },
      });
      res.status(500).json({ success: false, error: 'Failed to create group' });
    }
  },

  /**
   * PUT /groups/:id - Update a group
   */
  async update(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const startTime = Date.now();
    const { id } = req.params;
    const { name, agentIds, sessionId } = req.body;

    try {
      logger.debug('Updating group', {
        requestId,
        operation: 'updateGroup',
        details: { groupId: id, name },
      });

      const group = await groupsService.update(id, { name, agentIds, sessionId });

      if (!group) {
        logger.warn('Group not found for update', { requestId, operation: 'updateGroup', details: { groupId: id } });
        return res.status(404).json({ success: false, error: 'Group not found' });
      }

      const duration = Date.now() - startTime;
      logger.info('Group updated', {
        requestId,
        operation: 'updateGroup',
        duration,
        details: { groupId: id, name: group.name, agentCount: group.agentIds.length },
      });

      res.json({ success: true, data: group });
    } catch (error) {
      logger.error('Failed to update group', {
        requestId,
        operation: 'updateGroup',
        error: error as Error,
        details: { groupId: id },
      });
      res.status(500).json({ success: false, error: 'Failed to update group' });
    }
  },

  /**
   * DELETE /groups/:id - Delete a group
   */
  async delete(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const { id } = req.params;

    try {
      logger.debug('Deleting group', { requestId, operation: 'deleteGroup', details: { groupId: id } });

      await groupsService.delete(id);

      logger.info('Group deleted', { requestId, operation: 'deleteGroup', details: { groupId: id } });
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete group', {
        requestId,
        operation: 'deleteGroup',
        error: error as Error,
        details: { groupId: id },
      });
      res.status(500).json({ success: false, error: 'Failed to delete group' });
    }
  },
};