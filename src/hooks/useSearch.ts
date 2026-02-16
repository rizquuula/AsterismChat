import { useState, useCallback, useEffect, useMemo } from 'react';
import { Message, Agent } from '../types';
import { searchMessages, SearchFilters, SearchResult, debounce } from '../utils/search';

interface UseSearchOptions {
  messages: Message[];
  agents: Agent[];
}

interface UseSearchReturn {
  query: string;
  setQuery: (query: string) => void;
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  results: SearchResult[];
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  isSearching: boolean;
}

export function useSearch({ messages, agents }: UseSearchOptions): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({
    sender: 'all',
    dateRange: { start: null, end: null },
  });
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Debounced search
  const performSearch = useCallback(
    debounce((searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        return;
      }
      
      setIsSearching(true);
      const searchResults = searchMessages(
        messages,
        agents,
        searchQuery,
        filters
      );
      setResults(searchResults);
      setSelectedIndex(0);
      setIsSearching(false);
    }, 300),
    [messages, agents, filters]
  );

  // Trigger search when query or filters change
  useEffect(() => {
    performSearch(query);
  }, [query, filters, performSearch]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  return {
    query,
    setQuery,
    filters,
    setFilters,
    results,
    selectedIndex,
    setSelectedIndex,
    isSearching,
  };
}

// Highlight matching text helper
export function highlightText(text: string, searchQuery: string): string {
  if (!searchQuery.trim()) return text;
  
  const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, i) => 
    regex.test(part) 
      ? `<mark class="bg-[#0A84FF]/30 text-white px-0.5 rounded">${part}</mark>` 
      : part
  ).join('');
}