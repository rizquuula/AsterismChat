import React, { createContext, useContext, useReducer, useEffect, useCallback, ReactNode } from 'react';
import { ChatState, Agent, Message, Group } from '../types';
import { useLocalStorage, generateUUID } from '../hooks/useLocalStorage';
import { chatReducer, initialState } from './chatReducer';
import {
  createAddAgent,
  createUpdateAgent,
  createDeleteAgent,
  createAddGroup,
  createUpdateGroup,
  createDeleteGroup,
  createSetActiveGroup,
  createAddMessage,
  createUpdateMessage,
  createClearMessages,
  createStartNewSession,
  createGetActiveGroupMessages,
  createCreateGroupForAgent,
} from './chatActions';
import { callAgentApi } from './chatApi';

const STORAGE_KEY = 'asterism-chat-state';

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<any>;
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt'>) => void;
  updateAgent: (agent: Agent) => void;
  deleteAgent: (id: string) => void;
  addGroup: (name: string, agentIds: string[]) => Group;
  updateGroup: (group: Group) => void;
  deleteGroup: (id: string) => void;
  setActiveGroup: (id: string | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  sendMessage: (content: string) => Promise<void>;
  createGroupForAgent: (agentId: string) => Group | null;
  startNewSession: () => void;
  getActiveGroupMessages: () => Message[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [storedState, setStoredState] = useLocalStorage<ChatState>(STORAGE_KEY, initialState);
  
  const initialStateWithSession = storedState.sessionId 
    ? storedState 
    : { ...initialState, sessionId: generateUUID() };

  const [state, dispatch] = useReducer(chatReducer, initialStateWithSession);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    setStoredState(state);
  }, [state, setStoredState]);

  // Create action creators with dependencies
  const addAgent = useCallback(createAddAgent(dispatch), [dispatch]);
  const updateAgent = useCallback(createUpdateAgent(dispatch), [dispatch]);
  const deleteAgent = useCallback(createDeleteAgent(dispatch), [dispatch]);
  const addGroup = useCallback(createAddGroup(dispatch), [dispatch]);
  const updateGroup = useCallback(createUpdateGroup(dispatch), [dispatch]);
  const deleteGroup = useCallback(createDeleteGroup(dispatch, () => state.groups), [dispatch, state.groups]);
  const setActiveGroup = useCallback(createSetActiveGroup(dispatch, () => state.groups), [dispatch, state.groups]);
  const addMessage = useCallback(createAddMessage(dispatch), [dispatch]);
  const updateMessage = useCallback(createUpdateMessage(dispatch), [dispatch]);
  const clearMessages = useCallback(createClearMessages(dispatch), [dispatch]);
  
  const getActiveGroupMessages = useCallback(
    createGetActiveGroupMessages(() => ({ activeGroupId: state.activeGroupId, groups: state.groups, messages: state.messages })),
    [state.activeGroupId, state.groups, state.messages]
  );

  const startNewSession = useCallback(() => {
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
  }, [state.sessionId, state.activeGroupId, state.groups, addMessage, updateGroup, dispatch]);

  const createGroupForAgent = useCallback(
    createCreateGroupForAgent(
      dispatch,
      () => state.agents,
      () => state.groups,
      setActiveGroup,
      addGroup
    ),
    [dispatch, state.agents, state.groups, setActiveGroup, addGroup]
  );

  const sendMessage = useCallback(async (content: string) => {
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
        sessionId = group.sessionId;
      }
    } else {
      targetAgentIds = state.agents.map(a => a.id);
      sessionId = state.sessionId;
    }

    if (targetAgentIds.length === 0) return;

    // Add user message
    addMessage({
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

      const pendingMessageId = generateUUID();
      const timestamp = Date.now();

      // Add placeholder for agent response
      const pendingMessage: Message = {
        id: pendingMessageId,
        sessionId,
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
  }, [state.activeGroupId, state.groups, state.agents, state.sessionId, addMessage, startNewSession, updateMessage, updateAgent, dispatch]);

  return (
    <ChatContext.Provider
      value={{
        state,
        dispatch,
        addAgent,
        updateAgent,
        deleteAgent,
        addGroup,
        updateGroup,
        deleteGroup,
        setActiveGroup,
        addMessage,
        updateMessage,
        clearMessages,
        sendMessage,
        createGroupForAgent,
        startNewSession,
        getActiveGroupMessages,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}