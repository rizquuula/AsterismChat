import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { ChatState, Agent, Message, Group, ChatAction } from '../types';
import { generateUUID } from '../hooks/useLocalStorage';
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
  createGetActiveGroupMessages,
} from './chatActions';
import { callAgentApi } from './chatApi';
import { createChatService } from './services/chatService';
import { getAgents, getGroups, checkHealth, getLatestSession } from '../services/api';

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
  addAgent: (agent: Omit<Agent, 'id' | 'createdAt'>) => void;
  updateAgent: (agent: Agent) => void;
  deleteAgent: (id: string) => void;
  addGroup: (name: string, agentIds: string[]) => Promise<Group>;
  updateGroup: (group: Group) => void;
  deleteGroup: (id: string) => void;
  setActiveGroup: (id: string | null) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<Message>;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  sendMessage: (content: string) => Promise<void>;
  createGroupForAgent: (agentId: string) => Promise<Group | null>;
  startNewSession: () => void;
  getActiveGroupMessages: () => Message[];
  isBackendAvailable: boolean;
  isLoading: boolean;
  isLoadingMessages: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isBackendAvailable, setIsBackendAvailable] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);
  
  const [state, dispatch] = useReducer(chatReducer, initialState);

  useEffect(() => {
    async function loadInitialState() {
      const healthOk = await checkHealth();
      setIsBackendAvailable(healthOk);

      if (healthOk) {
        const [agentsRes, groupsRes, latestSessionRes] = await Promise.all([
          getAgents(),
          getGroups(),
          getLatestSession(),
        ]);

        const agents = agentsRes.success && agentsRes.data ? agentsRes.data : [];
        const groups = groupsRes.success && groupsRes.data ? groupsRes.data : [];

        if (latestSessionRes.success && latestSessionRes.data) {
          const { group, sessionId, messages } = latestSessionRes.data;
          
          const existingGroup = groups.find(g => g.id === group.id);
          const mergedGroups = existingGroup 
            ? groups 
            : [...groups, group];
          
          dispatch({ 
            type: 'LOAD_STATE', 
            payload: {
              agents,
              groups: mergedGroups,
              messages,
              activeGroupId: group.id,
              sessionId,
            }
          });
        } else {
          dispatch({ 
            type: 'LOAD_STATE', 
            payload: {
              agents,
              groups,
              messages: [],
              activeGroupId: null,
              sessionId: generateUUID(),
            }
          });
        }
      }
      
      setIsLoading(false);
    }

    loadInitialState();
  }, []);

  // Create action creators with dependencies
  const addAgent = useCallback(createAddAgent(dispatch), [dispatch]);
  const updateAgent = useCallback(createUpdateAgent(dispatch), [dispatch]);
  const deleteAgent = useCallback(createDeleteAgent(dispatch), [dispatch]);
  const addGroup = useCallback(createAddGroup(dispatch), [dispatch]);
  const updateGroup = useCallback(createUpdateGroup(dispatch), [dispatch]);
  const deleteGroup = useCallback(createDeleteGroup(dispatch, () => state.groups), [dispatch, state.groups]);
  const setActiveGroup = useCallback(createSetActiveGroup(dispatch, () => state.groups, () => state.sessionId, setIsLoadingMessages), [dispatch, state.groups, state.sessionId, setIsLoadingMessages]);
  const addMessage = useCallback(createAddMessage(dispatch), [dispatch]);
  const updateMessage = useCallback(createUpdateMessage(dispatch), [dispatch]);
  const clearMessages = useCallback(createClearMessages(dispatch, () => state.sessionId), [dispatch, state.sessionId]);
  
  const getActiveGroupMessages = useCallback(
    createGetActiveGroupMessages(() => ({ activeGroupId: state.activeGroupId, groups: state.groups, messages: state.messages, sessionId: state.sessionId })),
    [state.activeGroupId, state.groups, state.messages, state.sessionId]
  );

  // Create chat service with dependencies
  const chatService = useMemo(() => {
    return createChatService({
      dispatch,
      getState: () => state,
      addMessage,
      updateMessage,
      updateAgent,
      updateGroup,
      addGroup,
      setActiveGroup,
    });
  }, [dispatch, state, addMessage, updateMessage, updateAgent, updateGroup, addGroup, setActiveGroup]);

  // Expose service methods
  const { startNewSession, createGroupForAgent, sendMessage } = chatService;

  // Wrap sendMessage to include the API call
  const handleSendMessage = useCallback(async (content: string) => {
    await chatService.sendMessage(content, callAgentApi);
  }, [chatService]);

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
        sendMessage: handleSendMessage,
        createGroupForAgent,
        startNewSession,
        getActiveGroupMessages,
        isBackendAvailable,
        isLoading,
        isLoadingMessages,
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