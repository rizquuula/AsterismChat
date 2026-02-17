import { Agent, Group, Message, ChatState } from '../../types';
import { generateUUID } from '../../hooks/useLocalStorage';
import { Dispatch } from 'react';
import { ChatAction } from '../../types';

interface ChatServiceDeps {
  dispatch: Dispatch<ChatAction>;
  getState: () => ChatState;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Message;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  updateAgent: (agent: Agent) => void;
  updateGroup: (group: Group) => void;
  addGroup: (name: string, agentIds: string[]) => Group;
  setActiveGroup: (id: string | null) => void;
}

export function createChatService(deps: ChatServiceDeps) {
  const { dispatch, getState, addMessage, updateMessage, updateAgent, updateGroup, addGroup, setActiveGroup } = deps;

  const startNewSession = () => {
    const state = getState();
    const newSessionId = generateUUID();
    const groupId = state.activeGroupId || '';
    
    addMessage({
      sessionId: state.sessionId,
      groupId,
      content: `New chat session initialized with id "${newSessionId}"`,
      sender: 'system',
      senderName: 'System',
      status: 'sent',
    });
    
    dispatch({ type: 'SET_SESSION_ID', payload: newSessionId });
    
    if (state.activeGroupId) {
      const group = state.groups.find(g => g.id === state.activeGroupId);
      if (group) {
        updateGroup({ ...group, sessionId: newSessionId });
      }
    }
  };

  const createGroupForAgent = (agentId: string): Group | null => {
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
    const group = addGroup(groupName, [agentId]);
    setActiveGroup(group.id);
    return group;
  };

  const sendMessage = async (content: string, callAgentApi: (agent: Agent, sessionId: string, content: string) => Promise<string>) => {
    const state = getState();
    
    // Handle "/new" command
    if (content.trim().toLowerCase() === '/new') {
      startNewSession();
      return;
    }

    // Get target agents from active group or all agents
    let targetAgentIds: string[];
    let sessionId: string;
    let groupId: string;

    if (state.activeGroupId) {
      const group = state.groups.find(g => g.id === state.activeGroupId);
      if (!group) {
        targetAgentIds = state.agents.map(a => a.id);
        sessionId = state.sessionId;
        groupId = '';
      } else {
        targetAgentIds = group.agentIds;
        sessionId = group.sessionId;
        groupId = group.id;
      }
    } else {
      targetAgentIds = state.agents.map(a => a.id);
      sessionId = state.sessionId;
      groupId = '';
    }

    if (targetAgentIds.length === 0) return;

    // Add user message
    addMessage({
      sessionId,
      groupId,
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

      const pendingMessageId = generateUUID();
      const timestamp = Date.now();

      // Add placeholder for agent response
      const pendingMessage: Message = {
        id: pendingMessageId,
        sessionId,
        groupId,
        content: '',
        sender: agentId,
        senderName: agent.name,
        timestamp,
        status: 'sending',
        targets: [agentId],
      };
      dispatch({ type: 'ADD_MESSAGE', payload: pendingMessage });

      try {
        const agentContent = await callAgentApi(agent, sessionId, content);

        updateMessage(pendingMessageId, {
          content: agentContent,
          status: 'sent',
        });

        updateAgent({ ...agent, lastResponseAt: Date.now() });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        updateMessage(pendingMessageId, {
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