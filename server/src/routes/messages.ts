import { Router, Request, Response } from 'express';
import prisma from '../db/client';
import { Message } from '../types';
import logger from '../utils/logger';

const router = Router();

// Get all messages (with optional filters)
router.get('/', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  const { sessionId, groupId } = req.query;
  
  try {
    logger.debug('Fetching messages', { 
      requestId, 
      operation: 'getMessages',
      details: { sessionId, groupId }
    });

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

    const duration = Date.now() - startTime;
    logger.info('Messages fetched', { 
      requestId, 
      operation: 'getMessages', 
      duration,
      details: { count: formattedMessages.length, sessionId, groupId }
    });
    
    res.json({ success: true, data: formattedMessages });
  } catch (error) {
    logger.error('Failed to fetch messages', { 
      requestId, 
      operation: 'getMessages',
      error: error as Error 
    });
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

// Get single message
router.get('/:id', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { id } = req.params;
  
  try {
    logger.debug('Fetching message', { requestId, operation: 'getMessage', details: { messageId: id } });
    
    const message = await prisma.message.findUnique({ where: { id } });

    if (!message) {
      logger.warn('Message not found', { requestId, operation: 'getMessage', details: { messageId: id } });
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

    logger.info('Message fetched', { 
      requestId, 
      operation: 'getMessage',
      details: { messageId: id, status: message.status }
    });
    
    res.json({ success: true, data: formattedMessage });
  } catch (error) {
    logger.error('Failed to fetch message', { 
      requestId, 
      operation: 'getMessage',
      error: error as Error,
      details: { messageId: id }
    });
    res.status(500).json({ success: false, error: 'Failed to fetch message' });
  }
});

// Create message
router.post('/', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  const { sessionId, groupId, content, sender, senderName, status, targets } = req.body;
  
  try {
    logger.debug('Creating message', { 
      requestId, 
      operation: 'createMessage',
      details: { sessionId, groupId, sender, status, contentLength: content?.length }
    });

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
        error: null,
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

    const duration = Date.now() - startTime;
    logger.info('Message created', { 
      requestId, 
      operation: 'createMessage', 
      duration,
      details: { messageId: message.id, status: message.status, contentLength: content?.length }
    });
    
    res.status(201).json({ success: true, data: formattedMessage });
  } catch (error) {
    logger.error('Failed to create message', { 
      requestId, 
      operation: 'createMessage',
      error: error as Error,
      details: { sessionId, groupId }
    });
    res.status(500).json({ success: false, error: 'Failed to create message' });
  }
});

// Update message
router.put('/:id', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const startTime = Date.now();
  const { id } = req.params;
  const { content, status, error } = req.body;
  
  try {
    logger.debug('Updating message', { 
      requestId, 
      operation: 'updateMessage',
      details: { messageId: id, status, hasError: !!error }
    });

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

    const duration = Date.now() - startTime;
    logger.info('Message updated', { 
      requestId, 
      operation: 'updateMessage', 
      duration,
      details: { messageId: id, status: message.status }
    });
    
    res.json({ success: true, data: formattedMessage });
  } catch (error) {
    logger.error('Failed to update message', { 
      requestId, 
      operation: 'updateMessage',
      error: error as Error,
      details: { messageId: id }
    });
    res.status(500).json({ success: false, error: 'Failed to update message' });
  }
});

// Delete message
router.delete('/:id', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { id } = req.params;
  
  try {
    logger.debug('Deleting message', { requestId, operation: 'deleteMessage', details: { messageId: id } });
    
    await prisma.message.delete({ where: { id } });
    
    logger.info('Message deleted', { requestId, operation: 'deleteMessage', details: { messageId: id } });
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete message', { 
      requestId, 
      operation: 'deleteMessage',
      error: error as Error,
      details: { messageId: id }
    });
    res.status(500).json({ success: false, error: 'Failed to delete message' });
  }
});

// Clear messages (by sessionId)
router.delete('/', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;
  const { sessionId } = req.query;
  
  try {
    if (!sessionId) {
      logger.warn('sessionId required for clearing messages', { requestId, operation: 'clearMessages' });
      return res.status(400).json({ success: false, error: 'sessionId is required' });
    }

    logger.debug('Clearing messages', { requestId, operation: 'clearMessages', details: { sessionId } });
    
    const result = await prisma.message.deleteMany({ where: { sessionId: sessionId as string } });
    
    logger.info('Messages cleared', { 
      requestId, 
      operation: 'clearMessages',
      details: { sessionId, deletedCount: result.count }
    });
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to clear messages', { 
      requestId, 
      operation: 'clearMessages',
      error: error as Error,
      details: { sessionId }
    });
    res.status(500).json({ success: false, error: 'Failed to clear messages' });
  }
});

export default router;
