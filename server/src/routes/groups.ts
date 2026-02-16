import { Router, Request, Response } from 'express';
import prisma from '../db/client';
import { Group } from '../types';

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
  try {
    const groups = await prisma.group.findMany({
      orderBy: { createdAt: 'desc' },
    });

    const formattedGroups: Group[] = await Promise.all(
      groups.map((group) => formatGroup(group))
    );

    res.json({ success: true, data: formattedGroups });
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch groups' });
  }
});

// Get single group
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const group = await prisma.group.findUnique({ where: { id } });

    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    const formattedGroup = await formatGroup(group);
    res.json({ success: true, data: formattedGroup });
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch group' });
  }
});

// Create group
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, agentIds, sessionId } = req.body;

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
    res.status(201).json({ success: true, data: formattedGroup });
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ success: false, error: 'Failed to create group' });
  }
});

// Update group
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, agentIds, sessionId } = req.body;

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
    res.json({ success: true, data: formattedGroup });
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ success: false, error: 'Failed to update group' });
  }
});

// Delete group
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.group.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ success: false, error: 'Failed to delete group' });
  }
});

export default router;