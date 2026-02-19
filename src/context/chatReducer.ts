import { ChatState, ChatAction } from '../types';

export const initialState: ChatState = {
  agents: [],
  groups: [],
  messages: [],
  activeGroupId: null,
  sessionId: '',
};

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
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
        groups: state.groups.filter((group) => group.id !== action.payload.id),
        activeGroupId: state.activeGroupId === action.payload.id ? null : state.activeGroupId,
        // Note: Messages are now filtered by session, not groupId
        // When a group is deleted, messages remain but won't be displayed
        // if there's no active group/session
      };
    case 'SET_ACTIVE_GROUP':
      return {
        ...state,
        activeGroupId: action.payload,
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
        activeGroupId: action.payload.activeGroupId || null,
      };
    default:
      return state;
  }
}