import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
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
  createGetActiveGroupMessages,
} from './chatActions';
import { callAgentApi } from './chatApi';
import { createChatService } from './services/chatService';

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