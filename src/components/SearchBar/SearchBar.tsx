import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { searchMessages, SearchFilters, SearchResult, debounce, formatSearchDate } from '../../utils/search';

interface SearchBarProps {
  onClose: () => void;
  onJumpToMessage?: (messageId: string) => void;
}

export function SearchBar({ onClose, onJumpToMessage }: SearchBarProps) {
  const { state } = useChat();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    sender: 'all',
    dateRange: { start: null, end: null },
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  const performSearch = useCallback(
    debounce((searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }
      
      setIsSearching(true);
      const searchResults = searchMessages(
        state.messages,
        state.agents,
        searchQuery,
        filters
      );
      setResults(searchResults);
      setSelectedIndex(0);
      setIsSearching(false);
    }, 300),
    [state.messages, state.agents, filters]
  );

  // Trigger search when query or filters change
  useEffect(() => {
    performSearch(query);
  }, [query, filters, performSearch]);

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, results.length]);

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
  };

  const handleResultClick = (result: SearchResult) => {
    if (onJumpToMessage) {
      onJumpToMessage(result.message.id);
      onClose();
    }
  };

  // Highlight matching text
  const highlightText = (text: string, searchQuery: string) => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) 
        ? `<mark class="bg-[#0A84FF]/30 text-white px-0.5 rounded">${part}</mark>` 
        : part
    ).join('');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center pt-20">
      {/* Search Container */}
      <div className="w-full max-w-2xl mx-4 bg-[var(--bg-secondary)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden animate-fade-in-up">
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
            placeholder="Search messages..."
            className="flex-1 bg-transparent text-[16px] text-[var(--text-primary)] placeholder-[var(--text-tertiary)] outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          <kbd className="px-2 py-1 text-[11px] font-mono bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] rounded">
            ESC
          </kbd>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[var(--border)] bg-[var(--bg-tertiary)]/50">
          <span className="text-[12px] text-[var(--text-secondary)]">Filter:</span>
          <select
            value={filters.sender}
            onChange={(e) => setFilters(prev => ({ ...prev, sender: e.target.value as SearchFilters['sender'] }))}
            className="text-[13px] bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg px-2 py-1 border border-[var(--border)] outline-none"
          >
            <option value="all">All senders</option>
            <option value="user">You</option>
            <option value="system">System</option>
            {state.agents.map(agent => (
              <option key={agent.id} value={agent.id}>{agent.name}</option>
            ))}
          </select>
        </div>

        {/* Results */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="py-8 text-center text-[14px] text-[var(--text-secondary)]">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="py-8 text-center text-[14px] text-[var(--text-secondary)]">
              {query ? 'No messages found' : 'Type to search messages'}
            </div>
          ) : (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.message.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full text-left px-4 py-3 transition-colors ${
                    index === selectedIndex
                      ? 'bg-[var(--accent-primary)]/20'
                      : 'hover:bg-[var(--bg-tertiary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${
                      result.message.sender === 'user' ? 'bg-[var(--accent-primary)]' : 'bg-[var(--accent-success)]'
                    }`} />
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                      {result.senderName}
                    </span>
                    <span className="text-[12px] text-[var(--text-tertiary)]">
                      {formatSearchDate(result.message.timestamp)}
                    </span>
                  </div>
                  <p 
                    className="text-[14px] text-[var(--text-secondary)] line-clamp-2"
                    dangerouslySetInnerHTML={{ 
                      __html: highlightText(result.message.content, query) 
                    }}
                  />
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
          <span>{results.length} result{results.length !== 1 ? 's' : ''}</span>
        </div>
      </div>

      {/* Backdrop click to close */}
      <div className="absolute inset-0 -z-10" onClick={onClose} />
    </div>
  );
}