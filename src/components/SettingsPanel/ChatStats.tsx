import React from 'react';
import { ChatState } from '../../types';

interface ChatStatsProps {
  state: ChatState;
  className?: string;
}

export function ChatStats({ state, className = '' }: ChatStatsProps) {
  return (
    <div className={`p-4 bg-[#2C2C2E] rounded-xl ${className}`}>
      <h3 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide mb-3">
        Chat Statistics
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-[14px]">
          <span className="text-[#8E8E93]">Total Messages</span>
          <span className="text-white font-medium">{state.messages.length}</span>
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="text-[#8E8E93]">Total Agents</span>
          <span className="text-white font-medium">{state.agents.length}</span>
        </div>
      </div>
    </div>
  );
}