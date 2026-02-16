import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ChatState, ChatAction, Agent, Message, Group } from '../types';
import { useLocalStorage, generateUUID } from '../hooks/useLocalStorage';

const STORAGE_KEY = 'asterism-chat-state';

const initialState: ChatState = {
  agents: [],
  groups: [],
  messages: [],
  activeGroupId: null,
  sessionId: generateUUID(),
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'ADD_AGENT':
      return {
        ...state,
        agents: [...state.agents, action.payload],
      };
    case 'UPDATE_AGENT':
      return {
        ...state,
        agents: state.agents.map((agent) =>
          agent.id === action.payload.id ? action.payload : agent
        ),
      };
    case 'DELETE_AGENT':
      return {
        ...state,
        agents: state.agents.filter((agent) => agent.id !== action.payload),
        // Also remove from groups
        groups: state.groups.map(group => ({
          ...group,
          agentIds: group.agentIds.filter(id => id !== action.payload)
        })),
      };
    case 'ADD_GROUP':
      return {
        ...state,
        groups: [...state.groups, action.payload],
      };
    case 'UPDATE_GROUP':
      return {
        ...state,
        groups: state.groups.map((group) =>
          group.id === action.payload.id ? action.payload : group
        ),
      };
    case 'DELETE_GROUP':
      return {
        ...state,
        groups: state.groups.filter((group) => group.id !== action.payload),
        activeGroupId: state.activeGroupId === action.payload ? null : state.activeGroupId,
      };
    case 'SET_ACTIVE_GROUP':
      return {
        ...state,
        activeGroupId: action.payload,
        sessionId: action.payload 
          ? state.groups.find(g => g.id === action.payload)?.sessionId || generateUUID()
          : generateUUID(),
      };
    case 'ADD_MESSAGE':
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map((msg) =>
          msg.id === action.payload.id
            ? { ...msg, ...action.payload.updates }
            : msg
        ),
      };
    case 'CLEAR_MESSAGES':
      return {
        ...state,
        messages: [],
      };
    case 'SET_SESSION_ID':
      return {
        ...state,
        sessionId: action.payload,
      };
    case 'LOAD_STATE':
      return {
        ...action.payload,
        // Ensure backward compatibility
        activeGroupId: action.payload.activeGroupId || null,
      };
    default:
      return state;
  }
}

interface ChatContextType {
  state: ChatState;
  dispatch: React.Dispatch<ChatAction>;
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
  
  // Initialize with stored state or generate new session ID
  const [state, dispatch] = useReducer(chatReducer, storedState.sessionId 
    ? storedState 
    : { ...initialState, sessionId: generateUUID() });

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    setStoredState(state);
  }, [state, setStoredState]);

  const addAgent = (agentData: Omit<Agent, 'id' | 'createdAt'>) => {
    const agent: Agent = {
      ...agentData,
      id: generateUUID(),
      createdAt: Date.now(),
    };
    dispatch({ type: 'ADD_AGENT', payload: agent });
  };

  const updateAgent = (agent: Agent) => {
    dispatch({ type: 'UPDATE_AGENT', payload: agent });
  };

  const deleteAgent = (id: string) => {
    dispatch({ type: 'DELETE_AGENT', payload: id });
  };

  const addGroup = (name: string, agentIds: string[]): Group => {
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

  const updateGroup = (group: Group) => {
    dispatch({ type: 'UPDATE_GROUP', payload: group });
  };

  const deleteGroup = (id: string) => {
    dispatch({ type: 'DELETE_GROUP', payload: id });
  };

  const setActiveGroup = (id: string | null) => {
    dispatch({ type: 'SET_ACTIVE_GROUP', payload: id });
  };

  const addMessage = (messageData: Omit<Message, 'id' | 'timestamp'>) => {
    const message: Message = {
      ...messageData,
      id: generateUUID(),
      timestamp: Date.now(),
    };
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  };

  const updateMessage = (id: string, updates: Partial<Message>) => {
    dispatch({ type: 'UPDATE_MESSAGE', payload: { id, updates } });
  };

  const clearMessages = () => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  };

  const startNewSession = () => {
    const newSessionId = generateUUID();
    
    // Add system notification message
    addMessage({
      sessionId: state.sessionId,
      content: `New chat session initialized with id "${newSessionId}"`,
      sender: 'system',
      senderName: 'System',
      status: 'sent',
    });
    
    dispatch({ type: 'SET_SESSION_ID', payload: newSessionId });
    
    // Update active group's session if there's an active group
    if (state.activeGroupId) {
      const group = state.groups.find(g => g.id === state.activeGroupId);
      if (group) {
        updateGroup({ ...group, sessionId: newSessionId });
      }
    }
  };

  const getActiveGroupMessages = (): Message[] => {
    if (!state.activeGroupId) return [];
    const group = state.groups.find(g => g.id === state.activeGroupId);
    if (!group) return [];
    return state.messages.filter(m => m.sessionId === group.sessionId);
  };

  const createGroupForAgent = (agentId: string): Group | null => {
    const agent = state.agents.find(a => a.id === agentId);
    if (!agent) return null;

    // Check if group already exists for this agent
    const existingGroup = state.groups.find(g => 
      g.agentIds.length === 1 && g.agentIds.includes(agentId)
    );
    
    if (existingGroup) {
      setActiveGroup(existingGroup.id);
      return existingGroup;
    }

    // Create new group for this agent
    const groupName = `${agent.name}'s Chat`;
    const group = addGroup(groupName, [agentId]);
    setActiveGroup(group.id);
    return group;
  };

  const sendMessage = async (content: string) => {
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

      // Generate message ID upfront so we can update it later
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
        const response = await fetch(agent.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${agent.apiKey}`,
          },
          body: JSON.stringify({
            model: agent.model,
            messages: [
              {
                session_id: sessionId,
                role: 'user',
                content,
              },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        const agentContent = data.choices?.[0]?.message?.content || 'No response';

        // Use the pending message ID directly to update
        updateMessage(pendingMessageId, {
          content: agentContent,
          status: 'sent',
        });

        // Update agent's last response time
        updateAgent({ ...agent, lastResponseAt: Date.now() });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        // Use the pending message ID directly to update
        updateMessage(pendingMessageId, {
          content: '',
          status: 'error',
          error: errorMessage,
        });
      }
    }
  };

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