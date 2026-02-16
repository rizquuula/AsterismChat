import React from 'react';
import { Group, Agent } from '../../types';
import { Avatar } from '../common/Avatar';

interface GroupCardProps {
  group: Group;
  agents: Agent[];
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
}

export function GroupCard({ group, agents, isActive, onClick, onDelete }: GroupCardProps) {
  const groupAgents = agents.filter(a => group.agentIds.includes(a.id));

  return (
    <div
      className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-150 ${
        isActive 
          ? 'bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30' 
          : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] border border-transparent'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        {/* Group Avatar - Stack of avatars */}
        <div className="relative shrink-0">
          {groupAgents.length === 1 ? (
            <Avatar name={groupAgents[0].name} size="md" />
          ) : (
            <div className="flex -space-x-2">
              {groupAgents.slice(0, 3).map((agent, idx) => (
                <div key={agent.id} className="ring-2 ring-[var(--bg-primary)] rounded-full">
                  <Avatar name={agent.name} size="sm" />
                </div>
              ))}
              {groupAgents.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-[var(--bg-tertiary)] ring-2 ring-[var(--bg-primary)] flex items-center justify-center text-[10px] text-[var(--text-primary)] font-medium">
                  +{groupAgents.length - 3}
                </div>
              )}
            </div>
          )}
          {/* Active indicator - positioned on the right side of the avatar */}
          {isActive && (
            <div className="absolute top-0 right-0 w-3 h-3 bg-[var(--accent-success)] rounded-full border-2 border-[var(--bg-primary)]" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-semibold text-[var(--text-primary)] truncate">{group.name}</h3>
          <p className="text-[12px] text-[var(--text-secondary)] truncate">
            {groupAgents.length} agent{groupAgents.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      
      {/* Delete button - appears on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute top-2 right-2 p-1.5 text-[var(--text-secondary)] hover:text-[var(--accent-error)] hover:bg-[var(--accent-error)]/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-150"
        title="Delete group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      </button>
    </div>
  );
}