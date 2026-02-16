import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { Group } from '../../types';

interface TabBarProps {
  onNewTab: () => void;
}

export function TabBar({ onNewTab }: TabBarProps) {
  const { state, setActiveGroup, deleteGroup } = useChat();
  const { groups, agents, activeGroupId } = state;
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; groupId: string } | null>(null);

  const handleTabClick = (groupId: string) => {
    setActiveGroup(groupId);
  };

  const handleContextMenu = (e: React.MouseEvent, groupId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, groupId });
  };

  const handleCloseTab = (groupId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (groups.length > 1) {
      if (activeGroupId === groupId) {
        const currentIndex = groups.findIndex(g => g.id === groupId);
        const newIndex = currentIndex > 0 ? currentIndex - 1 : 1;
        setActiveGroup(groups[newIndex].id);
      }
      deleteGroup(groupId);
    }
    setContextMenu(null);
  };

  const handleRenameTab = (groupId: string) => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    
    const newName = prompt('Enter new tab name:', group.name);
    if (newName && newName.trim()) {
      // Would need to add updateGroup to context
    }
    setContextMenu(null);
  };

  // Get agent names for a group
  const getGroupSubtitle = (group: Group) => {
    const agentNames = group.agentIds
      .map(id => agents.find(a => a.id === id)?.name || 'Unknown')
      .slice(0, 2)
      .join(', ');
    
    if (group.agentIds.length > 2) {
      return `${agentNames} +${group.agentIds.length - 2}`;
    }
    return agentNames || 'No agents';
  };

  return (
    <>
      <div className="flex items-center gap-1 px-2 py-1 bg-[var(--bg-secondary)] border-b border-[var(--border)] overflow-x-auto">
        {/* Tabs */}
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => handleTabClick(group.id)}
            onContextMenu={(e) => handleContextMenu(e, group.id)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] transition-colors group min-w-0 ${
              activeGroupId === group.id
                ? 'bg-[var(--accent-primary)] text-white'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <span className="truncate max-w-[100px]">{group.name}</span>
            {groups.length > 1 && (
              <span
                onClick={(e) => handleCloseTab(group.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:bg-black/20 rounded p-0.5 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </button>
        ))}

        {/* New Tab Button */}
        <button
          onClick={onNewTab}
          className="p-1.5 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] rounded-lg transition-colors"
          title="New tab"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg shadow-xl py-1 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => handleRenameTab(contextMenu.groupId)}
              className="w-full px-3 py-2 text-left text-[14px] text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            >
              Rename
            </button>
            <button
              onClick={() => handleCloseTab(contextMenu.groupId)}
              className="w-full px-3 py-2 text-left text-[14px] text-[var(--accent-error)] hover:bg-[var(--bg-tertiary)]"
            >
              Close
            </button>
          </div>
        </>
      )}
    </>
  );
}