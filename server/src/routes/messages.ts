import { Router, Request, Response } from 'express';
import prisma from '../db/client';
import { Message } from '../types';

const router = Router();

// Get all messages (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { sessionId, groupId } = req.query;

    const where = sessionId 
      ? { sessionId: sessionId as string } 
      : groupId ? { groupId: groupId as string } 
      : {};

    const messages = await prisma.message.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });

    const formattedMessages: Message[] = messages.map((msg) => ({
      id: msg.id,
      sessionId: msg.sessionId,
      groupId: msg.groupId,
      content: msg.content,
      sender: msg.sender,
      senderName: msg.senderName,
      timestamp: Number(msg.timestamp),
      status: msg.status as Message['status'],
      targets: msg.targets as string[] | undefined,
      error: msg.error || undefined,
    }));

    res.json({ success: true, data: formattedMessages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// Get single message
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const message = await prisma.message.findUnique({ where: { id } });

    if (!message) {
      return res.status(404).json({ success: false, error: 'Message not found' });
    }

    const formattedMessage: Message = {
      id: message.id,
      sessionId: message.sessionId,
      groupId: message.groupId,
      content: message.content,
      sender: message.sender,
      senderName: message.senderName,
      timestamp: Number(message.timestamp),
      status: message.status as Message['status'],
      targets: message.targets as string[] | undefined,
      error: message.error || undefined,
    };

    res.json({ success: true, data: formattedMessage });
  } catch (error) {
    console.error('Error fetching message:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch message' });
  }
});

// Create message
router.post('/', async (req: Request, res: Response) => {
  try {
    const { sessionId, groupId, content, sender, senderName, status, targets, error } = req.body;

    const message = await prisma.message.create({
      data: {
        sessionId,
        groupId,
        content,
        sender,
        senderName,
        timestamp: BigInt(Date.now()),
        status,
        targets: targets || null,
        error: error || null,
      },
    });

    const formattedMessage: Message = {
      id: message.id,
      sessionId: message.sessionId,
      groupId: message.groupId,
      content: message.content,
      sender: message.sender,
      senderName: message.senderName,
      timestamp: Number(message.timestamp),
      status: message.status as Message['status'],
      targets: message.targets as string[] | undefined,
      error: message.error || undefined,
    };

    res.status(201).json({ success: true, data: formattedMessage });
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ success: false, error: 'Failed to create message' });
  }
});

// Update message
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, status, error } = req.body;

    const message = await prisma.message.update({
      where: { id },
      data: {
        ...(content !== undefined && { content }),
        ...(status && { status }),
        ...(error !== undefined && { error: error || null }),
      },
    });

    const formattedMessage: Message = {
      id: message.id,
      sessionId: message.sessionId,
      groupId: message.groupId,
      content: message.content,
      sender: message.sender,
      senderName: message.senderName,
      timestamp: Number(message.timestamp),
      status: message.status as Message['status'],
      targets: message.targets as string[] | undefined,
      error: message.error || undefined,
    };

    res.json({ success: true, data: formattedMessage });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ success: false, error: 'Failed to update message' });
  }
});

// Delete message
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.message.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
});

// Clear messages (by sessionId)
router.delete('/', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'sessionId is required' });
    }

    await prisma.message.deleteMany({ where: { sessionId: sessionId as string } });
    res.json({ success: true });
  } catch (error) {
    console.error('Error clearing messages:', error);
    res.status(500).json({ success: false, error: 'Failed to clear messages' });
  }
});

export default router;