import { Request, Response } from 'express';
import { messagesService } from '../services/messagesService';
import logger from '../utils/logger';

/**
 * Message Controller - Handles HTTP request/response for messages
 */
export const messagesController = {
  /**
   * GET /messages - Get all messages with optional filters
   */
  async getAll(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const startTime = Date.now();
    const { sessionId } = req.query;

    try {
      logger.debug('Fetching messages', {
        requestId,
        operation: 'getMessages',
        details: { sessionId },
      });

      const messages = await messagesService.findAll({
        sessionId: sessionId as string,
      });

      const duration = Date.now() - startTime;
      logger.info('Messages fetched', {
        requestId,
        operation: 'getMessages',
        duration,
        details: { count: messages.length, sessionId },
      });

      res.json({ success: true, data: messages });
    } catch (error) {
      logger.error('Failed to fetch messages', {
        requestId,
        operation: 'getMessages',
        error: error as Error,
      });
      res.status(500).json({ success: false, error: 'Failed to fetch messages' });
    }
  },

  /**
   * GET /messages/:id - Get message by ID
   */
  async getById(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const { id } = req.params;

    try {
      logger.debug('Fetching message', { requestId, operation: 'getMessage', details: { messageId: id } });

      const message = await messagesService.findById(id);

      if (!message) {
        logger.warn('Message not found', { requestId, operation: 'getMessage', details: { messageId: id } });
        return res.status(404).json({ success: false, error: 'Message not found' });
      }

      logger.info('Message fetched', {
        requestId,
        operation: 'getMessage',
        details: { messageId: id, status: message.status },
      });

      res.json({ success: true, data: message });
    } catch (error) {
      logger.error('Failed to fetch message', {
        requestId,
        operation: 'getMessage',
        error: error as Error,
        details: { messageId: id },
      });
      res.status(500).json({ success: false, error: 'Failed to fetch message' });
    }
  },

  /**
   * POST /messages - Create a new message
   */
  async create(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const startTime = Date.now();
    const { sessionId, content, sender, senderName, status, targets, usage } = req.body;

    try {
      logger.debug('Creating message', {
        requestId,
        operation: 'createMessage',
        details: { sessionId, sender, status, contentLength: content?.length, hasUsage: !!usage },
      });

      const message = await messagesService.create({
        sessionId,
        content,
        sender,
        senderName,
        status,
        targets,
        usage,
      });

      const duration = Date.now() - startTime;
      logger.info('Message created', {
        requestId,
        operation: 'createMessage',
        duration,
        details: { messageId: message.id, status: message.status, contentLength: content?.length },
      });

      res.status(201).json({ success: true, data: message });
    } catch (error) {
      logger.error('Failed to create message', {
        requestId,
        operation: 'createMessage',
        error: error as Error,
        details: { sessionId },
      });
      res.status(500).json({ success: false, error: 'Failed to create message' });
    }
  },

  /**
   * PUT /messages/:id - Update a message
   */
  async update(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const startTime = Date.now();
    const { id } = req.params;
    const { content, status, error, usage } = req.body;

    try {
      logger.debug('Updating message', {
        requestId,
        operation: 'updateMessage',
        details: { messageId: id, status, hasError: !!error, hasUsage: !!usage },
      });

      const message = await messagesService.update(id, { content, status, error, usage });

      if (!message) {
        logger.warn('Message not found for update', { requestId, operation: 'updateMessage', details: { messageId: id } });
        return res.status(404).json({ success: false, error: 'Message not found' });
      }

      const duration = Date.now() - startTime;
      logger.info('Message updated', {
        requestId,
        operation: 'updateMessage',
        duration,
        details: { messageId: id, status: message.status },
      });

      res.json({ success: true, data: message });
    } catch (error) {
      logger.error('Failed to update message', {
        requestId,
        operation: 'updateMessage',
        error: error as Error,
        details: { messageId: id },
      });
      res.status(500).json({ success: false, error: 'Failed to update message' });
    }
  },

  /**
   * DELETE /messages/:id - Delete a message
   */
  async delete(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const { id } = req.params;

    try {
      logger.debug('Deleting message', { requestId, operation: 'deleteMessage', details: { messageId: id } });

      await messagesService.delete(id);

      logger.info('Message deleted', { requestId, operation: 'deleteMessage', details: { messageId: id } });
      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to delete message', {
        requestId,
        operation: 'deleteMessage',
        error: error as Error,
        details: { messageId: id },
      });
      res.status(500).json({ success: false, error: 'Failed to delete message' });
    }
  },

  /**
   * DELETE /messages/clear?sessionId=xxx - Clear messages for a session
   */
  async clearBySession(req: Request, res: Response) {
    const requestId = (req as any).requestId;
    const { sessionId } = req.query;

    try {
      if (!sessionId) {
        logger.warn('sessionId required for clearing messages', { requestId, operation: 'clearMessages' });
        return res.status(400).json({ success: false, error: 'sessionId is required' });
      }

      logger.debug('Clearing messages', { requestId, operation: 'clearMessages', details: { sessionId } });

      const deletedCount = await messagesService.deleteBySessionId(sessionId as string);

      logger.info('Messages cleared', {
        requestId,
        operation: 'clearMessages',
        details: { sessionId, deletedCount },
      });

      res.json({ success: true });
    } catch (error) {
      logger.error('Failed to clear messages', {
        requestId,
        operation: 'clearMessages',
        error: error as Error,
        details: { sessionId },
      });
      res.status(500).json({ success: false, error: 'Failed to clear messages' });
    }
  },
};