import { Router, Request, Response } from 'express';
import prisma from '../db/client';
import { Agent } from '../types';

const router = Router();

// Get all agents
router.get('/', async (req: Request, res: Response) => {
  try {
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

    res.json({ success: true, data: formattedAgents });
  } catch (error) {
    console.error('Error fetching agents:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch agents' });
  }
});

// Get single agent
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const agent = await prisma.agent.findUnique({ where: { id } });

    if (!agent) {
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

    res.json({ success: true, data: formattedAgent });
  } catch (error) {
    console.error('Error fetching agent:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch agent' });
  }
});

// Create agent
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, endpoint, model, apiKey, settings } = req.body;

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

    res.status(201).json({ success: true, data: formattedAgent });
  } catch (error) {
    console.error('Error creating agent:', error);
    res.status(500).json({ success: false, error: 'Failed to create agent' });
  }
});

// Update agent
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, endpoint, model, apiKey, settings, lastResponseAt } = req.body;

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

    res.json({ success: true, data: formattedAgent });
  } catch (error) {
    console.error('Error updating agent:', error);
    res.status(500).json({ success: false, error: 'Failed to update agent' });
  }
});

// Delete agent
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.agent.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting agent:', error);
    res.status(500).json({ success: false, error: 'Failed to delete agent' });
  }
});

export default router;