import { Message, Agent } from '../types';

export interface SearchFilters {
  sender: 'all' | 'user' | 'system' | Agent['id'];
  dateRange: { start: number | null; end: number | null };
}

export interface SearchResult {
  message: Message;
  matchRanges: Array<{ start: number; end: number }>;
  senderName: string;
}

// Highlight matching text with markers
export function highlightMatches(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark class="bg-[var(--accent-primary)]/30 text-[var(--text-primary)] px-0.5 rounded">$1</mark>');
}

// Escape special regex characters
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Search messages by content
export function searchMessages(
  messages: Message[],
  agents: Agent[],
  query: string,
  filters: SearchFilters = { sender: 'all', dateRange: { start: null, end: null } }
): SearchResult[] {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results: SearchResult[] = [];

  for (const message of messages) {
    // Filter by sender
    if (filters.sender !== 'all') {
      if (filters.sender === 'user' && message.sender !== 'user') continue;
      if (filters.sender === 'system' && message.sender !== 'system') continue;
      if (filters.sender !== 'user' && filters.sender !== 'system' && message.sender !== filters.sender) continue;
    }

    // Filter by date range
    if (filters.dateRange.start && message.timestamp < filters.dateRange.start) continue;
    if (filters.dateRange.end && message.timestamp > filters.dateRange.end) continue;

    // Search in content
    const content = message.content.toLowerCase();
    const matchIndex = content.indexOf(lowerQuery);
    
    if (matchIndex !== -1) {
      // Find all match ranges
      const matchRanges: Array<{ start: number; end: number }> = [];
      let searchStart = 0;
      let idx = content.indexOf(lowerQuery, searchStart);
      
      while (idx !== -1) {
        matchRanges.push({ start: idx, end: idx + query.length });
        searchStart = idx + 1;
        idx = content.indexOf(lowerQuery, searchStart);
      }

      // Get sender name
      let senderName = message.senderName;
      if (message.sender !== 'user' && message.sender !== 'system') {
        const agent = agents.find(a => a.id === message.sender);
        if (agent) senderName = agent.name;
      }

      results.push({
        message,
        matchRanges,
        senderName,
      });
    }
  }

  return results;
}

// Get context around a match (for preview)
export function getMatchContext(
  content: string,
  matchStart: number,
  contextLength: number = 50
): { before: string; match: string; after: string } {
  const beforeStart = Math.max(0, matchStart - contextLength);
  const afterEnd = Math.min(content.length, matchStart + contextLength);
  
  const before = content.slice(beforeStart, matchStart);
  const match = content.slice(matchStart, matchStart + contextLength);
  const after = content.slice(matchStart + contextLength, afterEnd);
  
  // Add ellipsis if truncated
  const beforeEllipsis = beforeStart > 0 ? '...' : '';
  const afterEllipsis = afterEnd < content.length ? '...' : '';
  
  return {
    before: beforeEllipsis + before,
    match,
    after: after + afterEllipsis,
  };
}

// Debounce function for search input
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Format date for display in search results
export function formatSearchDate(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  
  // Less than 1 day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
  
  // Otherwise, show date
  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: new Date(timestamp).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}