import prisma from '../db/client';
import { Message } from '../types';
import { formatMessage } from '../utils/formatters';

/**
 * Message Service - Business logic for message operations
 */
export const messagesService = {
  /**
   * Get all messages with optional filters
   */
  async findAll(filters: { sessionId?: string; groupId?: string } = {}): Promise<Message[]> {
    const where: any = {};
    if (filters.sessionId) {
      where.sessionId = filters.sessionId;
    } else if (filters.groupId) {
      where.groupId = filters.groupId;
    }

    const messages = await prisma.message.findMany({
      where,
      orderBy: { timestamp: 'asc' },
    });
    return messages.map(formatMessage);
  },

  /**
   * Get message by ID
   */
  async findById(id: string): Promise<Message | null> {
    const message = await prisma.message.findUnique({ where: { id } });
    return message ? formatMessage(message) : null;
  },

  /**
   * Create a new message
   */
  async create(data: {
    sessionId: string;
    groupId: string;
    content: string;
    sender: string;
    senderName: string;
    status: string;
    targets?: string[];
    usage?: any;
  }): Promise<Message> {
    const message = await prisma.message.create({
      data: {
        sessionId: data.sessionId,
        groupId: data.groupId,
        content: data.content,
        sender: data.sender,
        senderName: data.senderName,
        timestamp: BigInt(Date.now()),
        status: data.status,
        targets: data.targets || undefined,
        error: null,
        usage: data.usage || undefined,
      },
    });
    return formatMessage(message);
  },

  /**
   * Update a message
   */
  async update(
    id: string,
    data: {
      content?: string;
      status?: string;
      error?: string | null;
      usage?: any;
    }
  ): Promise<Message | null> {
    const updateData: any = {};
    if (data.content !== undefined) updateData.content = data.content;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.error !== undefined) updateData.error = data.error || null;
    if (data.usage !== undefined) updateData.usage = data.usage || null;

    const message = await prisma.message.update({
      where: { id },
      data: updateData,
    });
    return formatMessage(message);
  },

  /**
   * Delete a message
   */
  async delete(id: string): Promise<void> {
    await prisma.message.delete({ where: { id } });
  },

  /**
   * Delete all messages for a session
   */
  async deleteBySessionId(sessionId: string): Promise<number> {
    const result = await prisma.message.deleteMany({ where: { sessionId } });
    return result.count;
  },
};