import { Router, Request, Response } from 'express';
import prisma from '../db/client';
import { Group } from '../types';
import logger from '../utils/logger';

const router = Router();

// Helper to convert DB group to frontend format
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

// Get all groups
router.get('/', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  
  try {
    logger.debug('Fetching all groups', { requestId, operation: 'getGroups' });
    
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formattedGroups: Group[] = await Promise.all(
      groups.map((group) => formatGroup(group))
    );

    const duration = Date.now() - startTime;
    logger.info('Groups fetched', { 
      requestId, 
      operation: 'getGroups', 
      duration,
      details: { count: formattedGroups.length }
    });
    
    res.json({ success: true, data: formattedGroups });
  } catch (error) {
    logger.error('Failed to fetch groups', { 
      requestId, 
      operation: 'getGroups',
      error: error as Error 
    });
    res.status(500).json({ success: false, error: 'Failed to fetch groups' });
  }
});

// Get single group
router.get('/:id', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { id } = req.params;
  
  try {
    logger.debug('Fetching group', { requestId, operation: 'getGroup', details: { groupId: id } });
    
    const group = await prisma.group.findUnique({ where: { id } });

    if (!group) {
      logger.warn('Group not found', { requestId, operation: 'getGroup', details: { groupId: id } });
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const formattedGroup = await formatGroup(group);
    
    logger.info('Group fetched', { 
      requestId, 
      operation: 'getGroup',
      details: { groupId: id, name: group.name, agentCount: formattedGroup.agentIds.length }
    });
    
    res.json({ success: true, data: formattedGroup });
  } catch (error) {
    logger.error('Failed to fetch group', { 
      requestId, 
      operation: 'getGroup',
      error: error as Error,
      details: { groupId: id }
    });
    res.status(500).json({ success: false, error: 'Failed to fetch group' });
  }
});

// Create group
router.post('/', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  const { name, agentIds, sessionId } = req.body;
  
  try {
    logger.debug('Creating group', { 
      requestId, 
      operation: 'createGroup',
      details: { name, agentIds: agentIds?.length, sessionId }
    });

    const group = await prisma.group.create({
      data: {
        name,
        sessionId: sessionId || crypto.randomUUID(),
        createdAt: BigInt(Date.now()),
      },
    });

    // Add agent associations
    if (agentIds && agentIds.length > 0) {
      await prisma.groupAgent.createMany({
        data: agentIds.map((agentId: string) => ({
          groupId: group.id,
          agentId,
        })),
      });
    }

    const formattedGroup = await formatGroup(group);
    
    const duration = Date.now() - startTime;
    logger.info('Group created', { 
      requestId, 
      operation: 'createGroup', 
      duration,
      details: { groupId: group.id, name: group.name, agentCount: formattedGroup.agentIds.length }
    });
    
    res.status(201).json({ success: true, data: formattedGroup });
  } catch (error) {
    logger.error('Failed to create group', { 
      requestId, 
      operation: 'createGroup',
      error: error as Error,
      details: { name }
    });
    res.status(500).json({ success: false, error: 'Failed to create group' });
  }
});

// Update group
router.put('/:id', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  const { id } = req.params;
  const { name, agentIds, sessionId } = req.body;
  
  try {
    logger.debug('Updating group', { 
      requestId, 
      operation: 'updateGroup',
      details: { groupId: id, name }
    });

    const group = await prisma.group.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(sessionId && { sessionId }),
      },
    });

    // Update agent associations if provided
    if (agentIds) {
      // Remove existing associations
      await prisma.groupAgent.deleteMany({ where: { groupId: id } });

      // Add new associations
      if (agentIds.length > 0) {
        await prisma.groupAgent.createMany({
          data: agentIds.map((agentId: string) => ({
            groupId: id,
            agentId,
          })),
        });
      }
    }

    const formattedGroup = await formatGroup(group);
    
    const duration = Date.now() - startTime;
    logger.info('Group updated', { 
      requestId, 
      operation: 'updateGroup', 
      duration,
      details: { groupId: id, name: group.name, agentCount: formattedGroup.agentIds.length }
    });
    
    res.json({ success: true, data: formattedGroup });
  } catch (error) {
    logger.error('Failed to update group', { 
      requestId, 
      operation: 'updateGroup',
      error: error as Error,
      details: { groupId: id }
    });
    res.status(500).json({ success: false, error: 'Failed to update group' });
  }
});

// Delete group
router.delete('/:id', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { id } = req.params;
  
  try {
    logger.debug('Deleting group', { requestId, operation: 'deleteGroup', details: { groupId: id } });
    
    await prisma.group.delete({ where: { id } });
    
    logger.info('Group deleted', { requestId, operation: 'deleteGroup', details: { groupId: id } });
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete group', { 
      requestId, 
      operation: 'deleteGroup',
      error: error as Error,
      details: { groupId: id }
    });
    res.status(500).json({ success: false, error: 'Failed to delete group' });
  }
});

export default router;
