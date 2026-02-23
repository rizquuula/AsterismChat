import { Agent, Group, Message, ChatState, Usage } from '../../types';
import { generateUUID } from '../../hooks/useLocalStorage';
import { Dispatch } from 'react';
import { ChatAction } from '../../types';

interface AgentApiResponse {
  content: string;
  usage?: Usage;
}

interface ChatServiceDeps {
  dispatch: Dispatch<ChatAction>;
  getState: () => ChatState;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<Message>;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  updateAgent: (agent: Agent) => void;
  updateGroup: (group: Group) => void;
  addGroup: (name: string, agentIds: string[]) => Promise<Group>;
  setActiveGroup: (id: string | null) => void;
}

export function createChatService(deps: ChatServiceDeps) {
  const { dispatch, getState, addMessage, updateMessage, updateAgent, updateGroup, addGroup, setActiveGroup } = deps;

  const startNewSession = async () => {
    const state = getState();
    const newSessionId = generateUUID();
    
    await addMessage({
      sessionId: state.sessionId,
      content: `New chat session initialized with id "${newSessionId}"`,
      sender: 'system',
      senderName: 'System',
      status: 'sent',
    });
    
    dispatch({ type: 'SET_SESSION_ID', payload: newSessionId });
    
    // Create new session in database if there's an active group
    if (state.activeGroupId) {
      try {
        const { createSession } = await import('../../services/api');
        await createSession(state.activeGroupId);
      } catch (error) {
        console.error('Failed to create session on server:', error);
      }
    }
  };

  const createGroupForAgent = async (agentId: string): Promise<Group | null> => {
    const state = getState();
    const agent = state.agents.find(a => a.id === agentId);
    if (!agent) return null;

    const existingGroup = state.groups.find(g => 
      g.agentIds.length === 1 && g.agentIds.includes(agentId)
    );
    
    if (existingGroup) {
      setActiveGroup(existingGroup.id);
      return existingGroup;
    }

    const groupName = `${agent.name}'s Chat`;
    const group = await addGroup(groupName, [agentId]);
    setActiveGroup(group.id);
    return group;
  };

  const sendMessage = async (content: string, callAgentApi: (agent: Agent, sessionId: string, content: string) => Promise<AgentApiResponse>) => {
    const state = getState();
    
    // Handle "/new" command
    if (content.trim().toLowerCase() === '/new') {
      startNewSession();
      return;
    }

    // Get target agents from active group or all agents
    let targetAgentIds: string[];
    let sessionId: string;

    if (state.activeGroupId) {
      const group = state.groups.find(g => g.id === state.activeGroupId);
      if (!group) {
        targetAgentIds = state.agents.map(a => a.id);
        sessionId = state.sessionId;
      } else {
        targetAgentIds = group.agentIds;
        sessionId = state.sessionId;
      }
    } else {
      targetAgentIds = state.agents.map(a => a.id);
      sessionId = state.sessionId;
    }

    if (targetAgentIds.length === 0) return;

    // Add user message
    await addMessage({
      sessionId,
      content,
      sender: 'user',
      senderName: 'You',
      status: 'sent',
      targets: targetAgentIds,
    });

    // Send to each selected agent
    for (const agentId of targetAgentIds) {
      const agent = state.agents.find(a => a.id === agentId);
      if (!agent) continue;

      // Add placeholder for agent response - this also creates it in the database
      const pendingMessage = await addMessage({
        sessionId,
        content: '',
        sender: agentId,
        senderName: agent.name,
        status: 'sending',
        targets: [agentId],
      });

      try {
        const { content: agentContent, usage } = await callAgentApi(agent, sessionId, content);

        updateMessage(pendingMessage.id, {
          content: agentContent,
          status: 'sent',
          usage,
        });

        updateAgent({ ...agent, lastResponseAt: Date.now() });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        updateMessage(pendingMessage.id, {
          content: '',
          status: 'error',
          error: errorMessage,
        });
      }
    }
  };

  return {
    startNewSession,
    createGroupForAgent,
    sendMessage,
  };
}