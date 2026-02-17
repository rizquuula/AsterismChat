import { Request, Response } from 'express';
import { agentsService } from '../services/agentsService';
import logger from '../utils/logger';

/**
 * Agent Controller - Handles HTTP request/response for agents
 */
export const agentsController = {
  /**
   * GET /agents - Get all agents
   */
  async getAll(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const startTime = Date.now();

    try {
      logger.debug('Fetching all agents', { requestId, operation: 'getAgents' });

      const agents = await agentsService.findAll();

      const duration = Date.now() - startTime;
      logger.info('Agents fetched', {
        requestId,
        operation: 'getAgents',
        duration,
        details: { count: agents.length },
      });

      res.json({ success: true, data: agents });
    } catch (error) {
      logger.error('Failed to fetch agents', {
        requestId,
        operation: 'getAgents',
        error: error as Error,
      });
      res.status(500).json({ success: false, error: 'Failed to fetch agents' });
    }
  },

  /**
   * GET /agents/:id - Get agent by ID
   */
  async getById(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const { id } = req.params;

    try {
      logger.debug('Fetching agent', { requestId, operation: 'getAgent', details: { agentId: id } });

      const agent = await agentsService.findById(id);

      if (!agent) {
        logger.warn('Agent not found', { requestId, operation: 'getAgent', details: { agentId: id } });
        return res.status(404).json({ success: false, error: 'Agent not found' });
      }

      logger.info('Agent fetched', {
        requestId,
        operation: 'getAgent',
        details: { agentId: id, name: agent.name },
      });

      res.json({ success: true, data: agent });
    } catch (error) {
      logger.error('Failed to fetch agent', {
        requestId,
        operation: 'getAgent',
        error: error as Error,
        details: { agentId: id },
      });
      res.status(500).json({ success: false, error: 'Failed to fetch agent' });
    }
  },

  /**
   * POST /agents - Create a new agent
   */
  async create(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const startTime = Date.now();
    const { name, endpoint, model, apiKey, settings } = req.body;

    try {
      logger.debug('Creating agent', {
        requestId,
        operation: 'createAgent',
        details: { name, endpoint, model },
      });

      const agent = await agentsService.create({ name, endpoint, model, apiKey, settings });

      const duration = Date.now() - startTime;
      logger.info('Agent created', {
        requestId,
        operation: 'createAgent',
        duration,
        details: { agentId: agent.id, name: agent.name },
      });

      res.status(201).json({ success: true, data: agent });
    } catch (error) {
      logger.error('Failed to create agent', {
        requestId,
        operation: 'createAgent',
        error: error as Error,
        details: { name },
      });
      res.status(500).json({ success: false, error: 'Failed to create agent' });
    }
  },

  /**
   * PUT /agents/:id - Update an agent
   */
  async update(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const startTime = Date.now();
    const { id } = req.params;
    const { name, endpoint, model, apiKey, settings, lastResponseAt } = req.body;

    try {
      logger.debug('Updating agent', {
        requestId,
        operation: 'updateAgent',
        details: { agentId: id, name },
      });

      const agent = await agentsService.update(id, {
        name,
        endpoint,
        model,
        apiKey,
        settings,
        lastResponseAt,
      });

      if (!agent) {
        logger.warn('Agent not found for update', { requestId, operation: 'updateAgent', details: { agentId: id } });
        return res.status(404).json({ success: false, error: 'Agent not found' });
      }

      const duration = Date.now() - startTime;
      logger.info('Agent updated', {
        requestId,
        operation: 'updateAgent',
        duration,
        details: { agentId: id, name: agent.name },
      });

      res.json({ success: true, data: agent });
    } catch (error) {
      logger.error('Failed to update agent', {
        requestId,
        operation: 'updateAgent',
        error: error as Error,
        details: { agentId: id },
      });
      res.status(500).json({ success: false, error: 'Failed to update agent' });
    }
  },

  /**
   * DELETE /agents/:id - Delete an agent
   */
  async delete(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const { id } = req.params;

    try {
      logger.debug('Deleting agent', { requestId, operation: 'deleteAgent', details: { agentId: id } });

      await agentsService.delete(id);

      logger.info('Agent deleted', { requestId, operation: 'deleteAgent', details: { agentId: id } });
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete agent', {
        requestId,
        operation: 'deleteAgent',
        error: error as Error,
        details: { agentId: id },
      });
      res.status(500).json({ success: false, error: 'Failed to delete agent' });
    }
  },

  /**
   * POST /agents/:id/chat - Call an agent with a message
   */
  async callAgent(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const startTime = Date.now();
    const { id: agentId } = req.params;
    const { sessionId, message } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'sessionId and message are required' 
      });
    }

    try {
      logger.debug('Calling agent', {
        requestId,
        operation: 'callAgent',
        details: { agentId, sessionId, messageLength: message.length },
      });

      const result = await agentsService.callAgent(agentId, sessionId, message);

      const duration = Date.now() - startTime;
      logger.info('Agent called successfully', {
        requestId,
        operation: 'callAgent',
        duration,
        details: { agentId, sessionId },
      });

      res.json({ success: true, data: result });
    } catch (error) {
      logger.error('Failed to call agent', {
        requestId,
        operation: 'callAgent',
        error: error as Error,
        details: { agentId, sessionId },
      });
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to call agent' 
      });
    }
  },
};
