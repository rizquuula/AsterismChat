import React from 'react';
import { ChatState } from '../../types';

interface ChatStatsProps {
  state: ChatState;
  className?: string;
}

export function ChatStats({ state, className = '' }: ChatStatsProps) {
  return (
    <div className={`p-4 bg-[var(--bg-secondary)] rounded-xl ${className}`}>
      <h3 className="text-[13px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide mb-3">
        Chat Statistics
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-[14px]">
          <span className="text-[var(--text-secondary)]">Total Messages</span>
          <span className="text-[var(--text-primary)] font-medium">{state.messages.length}</span>
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="text-[var(--text-secondary)]">Total Agents</span>
          <span className="text-[var(--text-primary)] font-medium">{state.agents.length}</span>
        </div>
      </div>
    </div>
  );
}