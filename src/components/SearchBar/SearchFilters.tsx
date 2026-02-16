import React from 'react';
import { Agent } from '../../types';
import { SearchFilters as SearchFiltersType } from '../../utils/search';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  agents: Agent[];
}

export function SearchFilters({ filters, onFiltersChange, agents }: SearchFiltersProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-tertiary)]/50">
      <span className="text-[12px] text-[var(--text-secondary)]">Filter:</span>
      <select
        value={filters.sender}
        onChange={(e) => onFiltersChange({ ...filters, sender: e.target.value as SearchFiltersType['sender'] })}
        className="text-[13px] bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg px-2 py-1 border border-[var(--border)] outline-none"
      >
        <option value="all">All senders</option>
        <option value="user">You</option>
        <option value="system">System</option>
        {agents.map(agent => (
          <option key={agent.id} value={agent.id}>{agent.name}</option>
        ))}
      </select>
    </div>
  );
}