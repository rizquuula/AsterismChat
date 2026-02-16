import React from 'react';
import { Agent } from '../../types';
import { Avatar } from '../common/Avatar';

interface AgentCardProps {
  agent: Agent;
  onClick: () => void;
  onDelete: () => void;
  onChat: () => void;
}

export function AgentCard({ agent, onClick, onDelete, onChat }: AgentCardProps) {
  const formatLastResponse = (timestamp?: number) => {
    if (!timestamp) return 'No responses yet';
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      className="group relative p-3 bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] rounded-xl cursor-pointer transition-all duration-150 hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <Avatar name={agent.name} size="md" />
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{agent.name}</h3>
          <p className="text-[12px] text-[var(--text-secondary)] truncate">{formatLastResponse(agent.lastResponseAt)}</p>
        </div>
      </div>
      
      {/* Action buttons - appear on hover */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onChat();
          }}
          className="p-1.5 text-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/10 rounded-lg"
          title="Start chat with this agent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 rounded-lg"
          title="Delete agent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
}