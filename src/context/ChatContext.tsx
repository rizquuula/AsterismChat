import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { ChatState, Agent, Message, Group } from '../types';
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
import { getState, saveState, checkHealth } from '../services/api';

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
  isBackendAvailable: boolean;
  isLoading: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isBackendAvailable, setIsBackendAvailable] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);
  const [initialStateLoaded, setInitialStateLoaded] = React.useState(false);
  
  // Start with initial state, will be replaced with backend data
  const [state, dispatch] = useReducer(chatReducer, { ...initialState, sessionId: generateUUID() });

  // Load state from backend on mount
  useEffect(() => {
    async function loadInitialState() {
      const healthOk = await checkHealth();
      setIsBackendAvailable(healthOk);

      if (healthOk) {
        const response = await getState();
        if (response.success && response.data) {
          dispatch({ type: 'LOAD_STATE', payload: response.data });
        }
      }
      
      setIsLoading(false);
      setInitialStateLoaded(true);
    }

    loadInitialState();
  }, []);

  // Debounce state for saving to backend
  const debouncedState = useDebounce(state, 1000);

  // Save state to backend when it changes (debounced)
  useEffect(() => {
    if (!initialStateLoaded || !isBackendAvailable) return;
    
    saveState(debouncedState).catch(err => {
      console.error('Failed to save state to backend:', err);
    });
  }, [debouncedState, initialStateLoaded, isBackendAvailable]);

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