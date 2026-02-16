import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ChatState, ChatAction, Agent, Message } from '../types';
import { useLocalStorage, generateUUID } from '../hooks/useLocalStorage';

const STORAGE_KEY = 'asterism-chat-state';

const initialState: ChatState = {
  agents: [],
  messages: [],
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
      return action.payload;
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
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  sendMessage: (content: string, targetAgentIds: string[]) => Promise<void>;
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

  const sendMessage = async (content: string, targetAgentIds: string[]) => {
    const targets = targetAgentIds.length === 0 
      ? state.agents.map(a => a.id) 
      : targetAgentIds;

    // Add user message
    const userMessageId = generateUUID();
    addMessage({
      sessionId: state.sessionId,
      content,
      sender: 'user',
      senderName: 'You',
      status: 'sent',
      targets,
    });

    // Send to each selected agent
    for (const agentId of targets) {
      const agent = state.agents.find(a => a.id === agentId);
      if (!agent) continue;

      const pendingMessageId = generateUUID();
      
      // Add placeholder for agent response
      addMessage({
        sessionId: state.sessionId,
        content: '',
        sender: agentId,
        senderName: agent.name,
        status: 'sending',
        targets: [agentId],
      });

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
                session_id: state.sessionId,
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

        // Update the message with the response
        const messages = state.messages;
        const msgIndex = messages.findIndex(m => m.sender === agentId && m.status === 'sending');
        if (msgIndex !== -1) {
          updateMessage(messages[msgIndex].id, {
            content: agentContent,
            status: 'sent',
          });
        } else {
          addMessage({
            sessionId: state.sessionId,
            content: agentContent,
            sender: agentId,
            senderName: agent.name,
            status: 'sent',
            targets: [agentId],
          });
        }

        // Update agent's last response time
        updateAgent({ ...agent, lastResponseAt: Date.now() });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        const messages = state.messages;
        const msgIndex = messages.findIndex(m => m.sender === agentId && m.status === 'sending');
        if (msgIndex !== -1) {
          updateMessage(messages[msgIndex].id, {
            content: '',
            status: 'error',
            error: errorMessage,
          });
        } else {
          addMessage({
            sessionId: state.sessionId,
            content: '',
            sender: agentId,
            senderName: agent.name,
            status: 'error',
            error: errorMessage,
            targets: [agentId],
          });
        }
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
        addMessage,
        updateMessage,
        clearMessages,
        sendMessage,
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