import { Agent, Group, Message, defaultAgentSettings, AgentSettings } from '../types';
import { generateUUID } from '../hooks/useLocalStorage';
import { Dispatch } from 'react';
import { ChatAction } from '../types';

export function createAddAgent(dispatch: Dispatch<ChatAction>) {
  return (agentData: Omit<Agent, 'id' | 'createdAt'>) => {
    const agent: Agent = {
      ...agentData,
      id: generateUUID(),
      createdAt: Date.now(),
      settings: agentData.settings || defaultAgentSettings,
    };
    dispatch({ type: 'ADD_AGENT', payload: agent });
  };
}

export function createUpdateAgent(dispatch: Dispatch<ChatAction>) {
  return (agent: Agent) => {
    dispatch({ type: 'UPDATE_AGENT', payload: agent });
  };
}

export function createDeleteAgent(dispatch: Dispatch<ChatAction>) {
  return (id: string) => {
    dispatch({ type: 'DELETE_AGENT', payload: id });
  };
}

export function createAddGroup(dispatch: Dispatch<ChatAction>) {
  return (name: string, agentIds: string[]): Group => {
    const group: Group = {
      id: generateUUID(),
      name,
      agentIds,
      sessionId: generateUUID(),
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_GROUP', payload: group });
    return group;
  };
}

export function createUpdateGroup(dispatch: Dispatch<ChatAction>) {
  return (group: Group) => {
    dispatch({ type: 'UPDATE_GROUP', payload: group });
  };
}

export function createDeleteGroup(dispatch: Dispatch<ChatAction>, getGroups: () => Group[]) {
  return (id: string) => {
    const group = getGroups().find(g => g.id === id);
    if (group) {
      dispatch({ type: 'DELETE_GROUP', payload: { id, sessionId: group.sessionId } });
    }
  };
}

export function createSetActiveGroup(dispatch: Dispatch<ChatAction>, getGroups: () => Group[]) {
  return (id: string | null) => {
    if (id) {
      const group = getGroups().find(g => g.id === id);
      if (group) {
        dispatch({ type: 'SET_SESSION_ID', payload: group.sessionId });
      }
    }
    dispatch({ type: 'SET_ACTIVE_GROUP', payload: id });
  };
}

export function createAddMessage(dispatch: Dispatch<ChatAction>) {
  return (messageData: Omit<Message, 'id' | 'timestamp'>): Message => {
    const message: Message = {
      ...messageData,
      id: generateUUID(),
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: message });
    return message;
  };
}

export function createUpdateMessage(dispatch: Dispatch<ChatAction>) {
  return (id: string, updates: Partial<Message>) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { id, updates } });
  };
}

export function createClearMessages(dispatch: Dispatch<ChatAction>) {
  return () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  };
}

export function createStartNewSession(dispatch: Dispatch<ChatAction>, getState: () => { sessionId: string; activeGroupId: string | null; groups: Group[] }, addMessage: ReturnType<typeof createAddMessage>, updateGroup: ReturnType<typeof createUpdateGroup>) {
  return () => {
    const state = getState();
    const newSessionId = generateUUID();
    
    addMessage({
      sessionId: state.sessionId,
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

export function createGetActiveGroupMessages(getState: () => { activeGroupId: string | null; groups: Group[]; messages: Message[] }) {
  return (): Message[] => {
    const state = getState();
    if (!state.activeGroupId) return [];
    const group = state.groups.find(g => g.id === state.activeGroupId);
    if (!group) return [];
    return state.messages.filter(m => m.sessionId === group.sessionId);
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