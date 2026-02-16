import React from 'react';
import { useChat } from '../../context/ChatContext';
import { AgentCard } from './AgentCard';

interface SidebarProps {
  onAddAgent: () => void;
  onEditAgent: (agentId: string) => void;
  onDeleteAgent: (agentId: string) => void;
}

export function Sidebar({ onAddAgent, onEditAgent, onDeleteAgent }: SidebarProps) {
  const { state } = useChat();
  const { agents } = state;

  return (
    <aside className="fixed left-0 top-14 bottom-[60px] w-[280px] bg-[#000000] border-r border-[#38383A] flex flex-col z-30">
      {/* Header */}
      <div className="p-4 border-b border-[#38383A]">
        <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Agents</h2>
      </div>

      {/* Agents List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#1C1C1E] flex items-center justify-center mb-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#636366]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
              </svg>
            </div>
            <p className="text-[14px] text-[#8E8E93]">No agents yet</p>
            <p className="text-[12px] text-[#636366] mt-1">Add your first agent to start</p>
          </div>
        ) : (
          agents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              onClick={() => onEditAgent(agent.id)}
              onDelete={() => onDeleteAgent(agent.id)}
            />
          ))
        )}
      </div>

      {/* Add Agent Button */}
      <div className="p-4 border-t border-[#38383A]">
        <button
          onClick={onAddAgent}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0A84FF] hover:bg-[#409CFF] text-white font-medium rounded-xl transition-colors duration-150"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Agent
        </button>
      </div>
    </aside>
  );
}