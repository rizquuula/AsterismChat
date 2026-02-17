import { Router, Request, Response } from 'express';
import prisma from '../db/client';
import { Agent } from '../types';
import logger from '../utils/logger';

const router = Router();

// Get all agents
router.get('/', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    logger.debug('Fetching all agents', { requestId, operation: 'getAgents' });
    
    const agents = await prisma.agent.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formattedAgents: Agent[] = agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      endpoint: agent.endpoint,
      model: agent.model,
      apiKey: agent.apiKey,
      createdAt: Number(agent.createdAt),
      lastResponseAt: agent.lastResponseAt ? Number(agent.lastResponseAt) : undefined,
      settings: agent.settings as Agent['settings'],
    }));

    const duration = Date.now() - startTime;
    logger.info('Agents fetched', { 
      requestId, 
      operation: 'getAgents', 
      duration,
      details: { count: formattedAgents.length }
    });
    
    res.json({ success: true, data: formattedAgents });
  } catch (error) {
    logger.error('Failed to fetch agents', { 
      requestId, 
      operation: 'getAgents',
      error: error as Error 
    });
    res.status(500).json({ success: false, error: 'Failed to fetch agents' });
  }
});

// Get single agent
router.get('/:id', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { id } = req.params;
  
  try {
    logger.debug('Fetching agent', { requestId, operation: 'getAgent', details: { agentId: id } });
    
    const agent = await prisma.agent.findUnique({ where: { id } });

    if (!agent) {
      logger.warn('Agent not found', { requestId, operation: 'getAgent', details: { agentId: id } });
      return res.status(404).json({ success: false, error: 'Agent not found' });
    }

    const formattedAgent: Agent = {
      id: agent.id,
      name: agent.name,
      endpoint: agent.endpoint,
      model: agent.model,
      apiKey: agent.apiKey,
      createdAt: Number(agent.createdAt),
      lastResponseAt: agent.lastResponseAt ? Number(agent.lastResponseAt) : undefined,
      settings: agent.settings as Agent['settings'],
    };

    logger.info('Agent fetched', { 
      requestId, 
      operation: 'getAgent',
      details: { agentId: id, name: agent.name }
    });
    
    res.json({ success: true, data: formattedAgent });
  } catch (error) {
    logger.error('Failed to fetch agent', { 
      requestId, 
      operation: 'getAgent',
      error: error as Error,
      details: { agentId: id }
    });
    res.status(500).json({ success: false, error: 'Failed to fetch agent' });
  }
});

// Create agent
router.post('/', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  const { name, endpoint, model, apiKey, settings } = req.body;
  
  try {
    logger.debug('Creating agent', { 
      requestId, 
      operation: 'createAgent',
      details: { name, endpoint, model }
    });

    const agent = await prisma.agent.create({
      data: {
        name,
        endpoint,
        model,
        apiKey,
        createdAt: BigInt(Date.now()),
        settings,
      },
    });

    const formattedAgent: Agent = {
      id: agent.id,
      name: agent.name,
      endpoint: agent.endpoint,
      model: agent.model,
      apiKey: agent.apiKey,
      createdAt: Number(agent.createdAt),
      settings: agent.settings as Agent['settings'],
    };

    const duration = Date.now() - startTime;
    logger.info('Agent created', { 
      requestId, 
      operation: 'createAgent', 
      duration,
      details: { agentId: agent.id, name: agent.name }
    });
    
    res.status(201).json({ success: true, data: formattedAgent });
  } catch (error) {
    logger.error('Failed to create agent', { 
      requestId, 
      operation: 'createAgent',
      error: error as Error,
      details: { name }
    });
    res.status(500).json({ success: false, error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  const { id } = req.params;
  const { name, endpoint, model, apiKey, settings, lastResponseAt } = req.body;
  
  try {
    logger.debug('Updating agent', { 
      requestId, 
      operation: 'updateAgent',
      details: { agentId: id, name }
    });

    const agent = await prisma.agent.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(endpoint && { endpoint }),
        ...(model && { model }),
        ...(apiKey && { apiKey }),
        ...(settings && { settings }),
        ...(lastResponseAt && { lastResponseAt: BigInt(lastResponseAt) }),
      },
    });

    const formattedAgent: Agent = {
      id: agent.id,
      name: agent.name,
      endpoint: agent.endpoint,
      model: agent.model,
      apiKey: agent.apiKey,
      createdAt: Number(agent.createdAt),
      lastResponseAt: agent.lastResponseAt ? Number(agent.lastResponseAt) : undefined,
      settings: agent.settings as Agent['settings'],
    };

    const duration = Date.now() - startTime;
    logger.info('Agent updated', { 
      requestId, 
      operation: 'updateAgent', 
      duration,
      details: { agentId: id, name: agent.name }
    });
    
    res.json({ success: true, data: formattedAgent });
  } catch (error) {
    logger.error('Failed to update agent', { 
      requestId, 
      operation: 'updateAgent',
      error: error as Error,
      details: { agentId: id }
    });
    res.status(500).json({ success: false, error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { id } = req.params;
  
  try {
    logger.debug('Deleting agent', { requestId, operation: 'deleteAgent', details: { agentId: id } });
    
    await prisma.agent.delete({ where: { id } });
    
    logger.info('Agent deleted', { requestId, operation: 'deleteAgent', details: { agentId: id } });
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete agent', { 
      requestId, 
      operation: 'deleteAgent',
      error: error as Error,
      details: { agentId: id }
    });
    res.status(500).json({ success: false, error: 'Failed to delete agent' });
  }
});

export default router;
