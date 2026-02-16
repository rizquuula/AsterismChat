import React, { useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import { useSearch } from '../../hooks/useSearch';
import { SearchInput } from './SearchInput';
import { SearchFilters } from './SearchFilters';
import { SearchResults } from './SearchResults';
import { SearchResult } from '../../utils/search';

interface SearchBarProps {
  onClose: () => void;
  onJumpToMessage?: (messageId: string) => void;
}

export function SearchBar({ onClose, onJumpToMessage }: SearchBarProps) {
  const { state } = useChat();
  
  const {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    selectedIndex,
    setSelectedIndex,
    isSearching,
  } = useSearch({
    messages: state.messages,
    agents: state.agents,
  });

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(Math.max(selectedIndex - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex] && onJumpToMessage) {
          onJumpToMessage(results[selectedIndex].message.id);
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [results, selectedIndex, onJumpToMessage, onClose, setSelectedIndex]);

  const handleResultSelect = useCallback((result: SearchResult) => {
    if (onJumpToMessage) {
      onJumpToMessage(result.message.id);
      onClose();
    }
  }, [onJumpToMessage, onClose]);

  const handleResultHover = useCallback((index: number) => {
    setSelectedIndex(index);
  }, [setSelectedIndex]);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20">
      {/* Search Container */}
      <div className="w-full max-w-2xl mx-4 bg-[var(--bg-secondary)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden animate-fade-in-up">
        {/* Search Input */}
        <SearchInput
          value={query}
          onChange={setQuery}
          onKeyDown={handleKeyDown}
        />

        {/* Filters */}
        <SearchFilters
          filters={filters}
          onFiltersChange={setFilters}
          agents={state.agents}
        />

        {/* Results */}
        {isSearching ? (
          <div className="max-h-96 overflow-y-auto">
            <div className="py-8 text-center text-[14px] text-[var(--text-secondary)]">
              Searching...
            </div>
          </div>
        ) : (
          <SearchResults
            results={results}
            selectedIndex={selectedIndex}
            onSelect={handleResultSelect}
            onHover={handleResultHover}
            searchQuery={query}
          />
        )}

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
          <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Backdrop click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}
