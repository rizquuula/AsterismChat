import React, { useRef, useEffect } from 'react';
import { SearchResult } from '../../utils/search';
import { formatSearchDate } from '../../utils/search';

interface SearchResultsProps {
  results: SearchResult[];
  selectedIndex: number;
  onSelect: (result: SearchResult) => void;
  onHover: (index: number) => void;
  searchQuery: string;
}

export function SearchResults({ results, selectedIndex, onSelect, onHover, searchQuery }: SearchResultsProps) {
  const resultsRef = useRef<HTMLDivElement>(null);

  // Scroll selected result into view
  useEffect(() => {
    if (resultsRef.current && results.length > 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, results.length]);

  // Highlight matching text
  const highlightText = (text: string): string => {
    if (!searchQuery.trim()) return text;
    
    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) 
        ? `<mark class="bg-[#0A84FF]/30 text-white px-0.5 rounded">${part}</mark>` 
        : part
    ).join('');
  };

  if (results.length === 0) {
    return (
      <div className="max-h-96 overflow-y-auto">
        <div className="py-8 text-center text-[14px] text-[var(--text-secondary)]">
          {searchQuery ? 'No messages found' : 'Type to search messages'}
        </div>
      </div>
    );
  }

  return (
    <div ref={resultsRef} className="max-h-96 overflow-y-auto">
      <div className="py-2">
        {results.map((result, index) => (
          <button
            key={result.message.id}
            onClick={() => onSelect(result)}
            onMouseEnter={() => onHover(index)}
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
                __html: highlightText(result.message.content) 
              }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}