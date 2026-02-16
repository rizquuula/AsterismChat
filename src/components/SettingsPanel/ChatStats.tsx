import React from 'react';
import { ChatState } from '../../types';

interface ChatStatsProps {
  state: ChatState;
  className?: string;
}

export function ChatStats({ state, className = '' }: ChatStatsProps) {
  return (
    <div className={`p-4 dark:bg-gray-800 bg-gray-100 rounded-xl ${className}`}>
      <h3 className="text-[13px] font-semibold dark:text-gray-400 text-gray-600 uppercase tracking-wide mb-3">
        Chat Statistics
      </h3>
      <div className="space-y-2">
        <div className="flex justify-between text-[14px]">
          <span className="dark:text-gray-400 text-gray-600">Total Messages</span>
          <span className="dark:text-white text-gray-900 font-medium">{state.messages.length}</span>
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="dark:text-gray-400 text-gray-600">Total Agents</span>
          <span className="dark:text-white text-gray-900 font-medium">{state.agents.length}</span>
        </div>
      </div>
    </div>
  );
}