import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import { Agent, Group } from '../../types';

interface QuickSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  type: 'agent' | 'group';
  name: string;
  icon: string;
  data: Agent | Group;
}

export function QuickSwitcher({ isOpen, onClose }: QuickSwitcherProps) {
  const { state, setActiveGroup, createGroupForAgent } = useChat();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build search results from agents and groups
  const results = useMemo((): SearchResult[] => {
    const items: SearchResult[] = [];

    // Add agents
    state.agents.forEach(agent => {
      items.push({
        id: `agent-${agent.id}`,
        type: 'agent',
        name: agent.name,
        icon: '🤖',
        data: agent,
      });
    });

    // Add groups
    state.groups.forEach(group => {
      items.push({
        id: `group-${group.id}`,
        type: 'group',
        name: group.name,
        icon: '👥',
        data: group,
      });
    });

    // Filter by query
    if (query.trim()) {
      const lowerQuery = query.toLowerCase();
      return items.filter(item => 
        item.name.toLowerCase().includes(lowerQuery)
      );
    }

    return items;
  }, [state.agents, state.groups, query]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleSelect = (result: SearchResult) => {
    if (result.type === 'group') {
      setActiveGroup(result.id.replace('group-', ''));
    } else {
      // For agents, create a group for them
      createGroupForAgent(result.id.replace('agent-', ''));
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Quick Switcher Modal */}
      <div className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50 animate-fade-in-up">
        <div className="mx-4 bg-[var(--bg-secondary)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--border)]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--text-secondary)]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search agents and groups..."
              className="flex-1 bg-transparent text-[16px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
            />
            <kbd className="px-2 py-1 text-[11px] font-mono bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] rounded">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-80 overflow-y-auto">
            {results.length === 0 ? (
              <div className="py-8 text-center text-[14px] text-[var(--text-secondary)]">
                No agents or groups found
              </div>
            ) : (
              <div className="py-2">
                {results.map((result, index) => (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-[var(--accent-primary)]/20 text-[var(--text-primary)]'
                        : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                    }`}
                  >
                    <span className="text-xl">{result.icon}</span>
                    <div className="flex-1">
                      <div className="text-[15px] font-medium">{result.name}</div>
                      <div className="text-[12px] text-[var(--text-secondary)]">
                        {result.type === 'agent' ? 'Agent' : 'Group'}
                      </div>
                    </div>
                    {index === selectedIndex && (
                      <span className="text-[12px] text-[var(--text-tertiary)]">↵ to select</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--text-tertiary)]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded">↑</kbd>
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded">↓</kbd>
                <span>to navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-[var(--bg-tertiary)] rounded">↵</kbd>
                <span>to select</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}