import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { AgentCard } from './AgentCard';
import { GroupCard } from './GroupCard';
import { GroupModal } from './GroupModal';
import { DeleteGroupModal } from './DeleteGroupModal';

interface SidebarProps {
  onAddAgent: () => void;
  onEditAgent: (agentId: string) => void;
  onDeleteAgent: (agentId: string) => void;
}

export function Sidebar({ onAddAgent, onEditAgent, onDeleteAgent }: SidebarProps) {
  const { state, addGroup, deleteGroup, setActiveGroup, createGroupForAgent } = useChat();
  const { agents, groups, activeGroupId } = state;
  
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isDeleteGroupModalOpen, setIsDeleteGroupModalOpen] = useState(false);
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null);

  const handleCreateGroup = (name: string, agentIds: string[]) => {
    const group = addGroup(name, agentIds);
    setActiveGroup(group.id);
  };

  const handleDeleteGroup = (groupId: string) => {
    setDeletingGroupId(groupId);
    setIsDeleteGroupModalOpen(true);
  };

  const confirmDeleteGroup = () => {
    if (deletingGroupId) {
      deleteGroup(deletingGroupId);
      setDeletingGroupId(null);
      setIsDeleteGroupModalOpen(false);
    }
  };

  const handleAgentChat = (agentId: string) => {
    createGroupForAgent(agentId);
  };

  const groupToDelete = groups.find(g => g.id === deletingGroupId);

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-[280px] bg-[#000000] border-r border-[#38383A] flex flex-col z-30">
      {/* Agents Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 border-b border-[#38383A]">
          <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Agents</h2>
        </div>
        
        <div className="p-4 space-y-2">
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
                onChat={() => handleAgentChat(agent.id)}
              />
            ))
          )}
        </div>

        {/* Groups Section */}
        <div className="border-t border-[#38383A]">
          <div className="p-4 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold text-[#8E8E93] uppercase tracking-wide">Groups</h2>
            <button
              onClick={() => setIsGroupModalOpen(true)}
              disabled={agents.length === 0}
              className="p-1.5 text-[#0A84FF] hover:bg-[#0A84FF]/10 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title="Create new group"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          <div className="px-4 pb-4 space-y-2">
            {groups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-[13px] text-[#636366]">No groups yet</p>
                <p className="text-[11px] text-[#636366] mt-1">Click + to create a group</p>
              </div>
            ) : (
              groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  agents={agents}
                  isActive={activeGroupId === group.id}
                  onClick={() => setActiveGroup(group.id)}
                  onDelete={() => handleDeleteGroup(group.id)}
                />
              ))
            )}
          </div>
        </div>
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

      {/* Create Group Modal */}
      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        agents={agents}
        onCreateGroup={handleCreateGroup}
      />

      {/* Delete Group Confirmation Modal */}
      <DeleteGroupModal
        isOpen={isDeleteGroupModalOpen}
        onClose={() => setIsDeleteGroupModalOpen(false)}
        group={groupToDelete}
        onConfirm={confirmDeleteGroup}
      />
    </aside>
  );
}