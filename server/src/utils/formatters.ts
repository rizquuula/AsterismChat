import { Agent, Group, Message } from '../types';
import prisma from '../db/client';

/**
 * Format a database agent to the API response type
 */
export function formatAgent(agent: any): Agent {
  return {
    id: agent.id,
    name: agent.name,
    endpoint: agent.endpoint,
    model: agent.model,
    apiKey: agent.apiKey,
    createdAt: Number(agent.createdAt),
    lastResponseAt: agent.lastResponseAt ? Number(agent.lastResponseAt) : undefined,
    settings: agent.settings as Agent['settings'],
  };
}

/**
 * Format a database group to the API response type (with agentIds)
 */
export async function formatGroup(group: any): Promise<Group> {
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

/**
 * Format a database group to the API response type using pre-fetched groupAgents
 * Use this when you've already fetched groupAgents to avoid N+1 queries
 */
export function formatGroupWithAgents(group: any, groupAgents: any[]): Group {
  return {
    id: group.id,
    name: group.name,
    sessionId: group.sessionId,
    createdAt: Number(group.createdAt),
    agentIds: groupAgents.map((ga) => ga.agentId),
  };
}

/**
 * Format a database message to the API response type
 */
export function formatMessage(message: any): Message {
  return {
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
}