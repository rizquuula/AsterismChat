import { Agent, Group, Message, defaultAgentSettings, AgentSettings } from '../types';
import { generateUUID } from '../hooks/useLocalStorage';
import { Dispatch } from 'react';
import { ChatAction } from '../types';
import { 
  deleteGroup as apiDeleteGroup, 
  deleteAgent as apiDeleteAgent,
  createAgent as apiCreateAgent,
  updateAgent as apiUpdateAgent,
  createGroup as apiCreateGroup,
  updateGroup as apiUpdateGroup,
  updateActiveGroup as apiUpdateActiveGroup,
  createMessage as apiCreateMessage,
  updateMessage as apiUpdateMessage,
  clearMessages as apiClearMessages,
} from '../services/api';

export function createAddAgent(dispatch: Dispatch<ChatAction>) {
  return async (agentData: Omit<Agent, 'id' | 'createdAt'>) => {
    const agent: Agent = {
      ...agentData,
      id: generateUUID(),
      createdAt: Date.now(),
      settings: agentData.settings || defaultAgentSettings,
    };
    dispatch({ type: 'ADD_AGENT', payload: agent });
    
    // Call API to create agent on server
    try {
      await apiCreateAgent(agentData);
    } catch (error) {
      console.error('Failed to create agent on server:', error);
    }
  };
}

export function createUpdateAgent(dispatch: Dispatch<ChatAction>) {
  return async (agent: Agent) => {
    dispatch({ type: 'UPDATE_AGENT', payload: agent });
    
    // Call API to update agent on server
    try {
      await apiUpdateAgent(agent);
    } catch (error) {
      console.error('Failed to update agent on server:', error);
    }
  };
}

export function createDeleteAgent(dispatch: Dispatch<ChatAction>) {
  return async (id: string) => {
    dispatch({ type: 'DELETE_AGENT', payload: id });
    
    // Call API to delete agent from server
    try {
      await apiDeleteAgent(id);
    } catch (error) {
      console.error('Failed to delete agent on server:', error);
    }
  };
}

export function createAddGroup(dispatch: Dispatch<ChatAction>) {
  return async (name: string, agentIds: string[], sessionId: string): Promise<Group> => {
    const group: Group = {
      id: generateUUID(),
      name,
      agentIds,
      sessionId,
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_GROUP', payload: group });
    
    // Call API to create group on server
    try {
      await apiCreateGroup(name, agentIds, sessionId);
    } catch (error) {
      console.error('Failed to create group on server:', error);
    }
    
    return group;
  };
}

export function createUpdateGroup(dispatch: Dispatch<ChatAction>) {
  return async (group: Group) => {
    dispatch({ type: 'UPDATE_GROUP', payload: group });
    
    // Call API to update group on server
    try {
      await apiUpdateGroup(group);
    } catch (error) {
      console.error('Failed to update group on server:', error);
    }
  };
}

export function createDeleteGroup(dispatch: Dispatch<ChatAction>, getGroups: () => Group[], useApi: boolean = true) {
  return async (id: string) => {
    const group = getGroups().find(g => g.id === id);
    if (group) {
      dispatch({ type: 'DELETE_GROUP', payload: { id, sessionId: group.sessionId, groupId: group.id } });
      
      // Call API to delete group from server
      if (useApi) {
        try {
          await apiDeleteGroup(id);
        } catch (error) {
          console.error('Failed to delete group on server:', error);
        }
      }
    }
  };
}

export function createSetActiveGroup(dispatch: Dispatch<ChatAction>, getGroups: () => Group[], getSessionId: () => string) {
  return async (id: string | null) => {
    let sessionId = getSessionId();
    
    if (id) {
      const group = getGroups().find(g => g.id === id);
      if (group) {
        sessionId = group.sessionId;
        dispatch({ type: 'SET_SESSION_ID', payload: group.sessionId });
      }
    }
    dispatch({ type: 'SET_ACTIVE_GROUP', payload: id });
    
    // Call API to update active group on server
    try {
      await apiUpdateActiveGroup(id, sessionId);
    } catch (error) {
      console.error('Failed to update active group on server:', error);
    }
  };
}

export function createAddMessage(dispatch: Dispatch<ChatAction>) {
  return async (messageData: Omit<Message, 'id' | 'timestamp'>): Promise<Message> => {
    const message: Message = {
      ...messageData,
      groupId: messageData.groupId || '',
      id: generateUUID(),
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: message });
    
    // Call API to create message on server
    try {
      await apiCreateMessage(messageData);
    } catch (error) {
      console.error('Failed to create message on server:', error);
    }
    
    return message;
  };
}

export function createUpdateMessage(dispatch: Dispatch<ChatAction>) {
  return async (id: string, updates: Partial<Message>) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { id, updates } });
    
    // Call API to update message on server
    try {
      await apiUpdateMessage(id, updates);
    } catch (error) {
      console.error('Failed to update message on server:', error);
    }
  };
}

export function createClearMessages(dispatch: Dispatch<ChatAction>, getSessionId: () => string) {
  return async () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
    
    // Call API to clear messages on server
    try {
      const sessionId = getSessionId();
      await apiClearMessages(sessionId);
    } catch (error) {
      console.error('Failed to clear messages on server:', error);
    }
  };
}

export function createStartNewSession(dispatch: Dispatch<ChatAction>, getState: () => { sessionId: string; activeGroupId: string | null; groups: Group[] }, addMessage: ReturnType<typeof createAddMessage>, updateGroup: ReturnType<typeof createUpdateGroup>) {
  return () => {
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
}

export function createGetActiveGroupMessages(getState: () => { activeGroupId: string | null; groups: Group[]; messages: Message[]; sessionId: string }) {
  return (): Message[] => {
    const state = getState();
    
    // If there's an active group, filter by groupId to isolate messages to that group
    if (state.activeGroupId) {
      return state.messages.filter(m => m.groupId === state.activeGroupId);
    }
    
    // If no active group, return all messages (user is chatting with all agents)
    return state.messages;
  };
}

export function createCreateGroupForAgent(
  dispatch: Dispatch<ChatAction>,
  getAgents: () => Agent[],
  getGroups: () => Group[],
  setActiveGroup: (id: string | null) => void,
  addGroup: (name: string, agentIds: string[]) => Group
) {
  return (agentId: string): Group | null => {
    const agents = getAgents();
    const groups = getGroups();
    const agent = agents.find(a => a.id === agentId);
    if (!agent) return null;

    const existingGroup = groups.find(g => 
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
}