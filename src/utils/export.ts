import { ChatState, Message, Agent, Group } from '../types';

export interface ExportOptions {
  format: 'json' | 'markdown' | 'text';
  includeMetadata?: boolean;
  dateRange?: { start: number; end: number };
  agents?: string[]; // filter by agent IDs
}

// Format timestamp for display
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Filter messages based on options
function filterMessages(messages: Message[], options: ExportOptions): Message[] {
  let filtered = [...messages];

  // Filter by date range
  if (options.dateRange) {
    filtered = filtered.filter(
      msg => msg.timestamp >= options.dateRange!.start && msg.timestamp <= options.dateRange!.end
    );
  }

  // Filter by agents
  if (options.agents && options.agents.length > 0) {
    filtered = filtered.filter(msg => {
      if (msg.sender === 'user' || msg.sender === 'system') return true;
      return options.agents!.includes(msg.sender);
    });
  }

  return filtered;
}

// Get agent name by ID
function getAgentName(agents: Agent[], agentId: string): string {
  if (agentId === 'user') return 'You';
  if (agentId === 'system') return 'System';
  const agent = agents.find(a => a.id === agentId);
  return agent?.name || 'Unknown Agent';
}

// Export to JSON
export function exportToJSON(state: ChatState, options: ExportOptions): string {
  const filteredMessages = filterMessages(state.messages, options);
  
  const exportData = {
    ...(options.includeMetadata && {
      exportedAt: new Date().toISOString(),
      sessionId: state.sessionId,
      totalMessages: filteredMessages.length,
    }),
    messages: filteredMessages.map(msg => ({
      id: msg.id,
      sessionId: msg.sessionId,
      content: msg.content,
      sender: getAgentName(state.agents, msg.sender),
      senderType: msg.sender,
      timestamp: msg.timestamp,
      formattedTime: formatTimestamp(msg.timestamp),
      status: msg.status,
    })),
    agents: options.includeMetadata ? state.agents.map(a => ({
      id: a.id,
      name: a.name,
      model: a.model,
    })) : undefined,
    groups: options.includeMetadata ? state.groups : undefined,
  };

  return JSON.stringify(exportData, null, 2);
}

// Export to Markdown
export function exportToMarkdown(state: ChatState, options: ExportOptions): string {
  const filteredMessages = filterMessages(state.messages, options);
  
  // Group messages by date
  const messagesByDate = new Map<string, Message[]>();
  filteredMessages.forEach(msg => {
    const dateKey = formatDate(msg.timestamp);
    if (!messagesByDate.has(dateKey)) {
      messagesByDate.set(dateKey, []);
    }
    messagesByDate.get(dateKey)!.push(msg);
  });

  let markdown = '# AsterismChat Export\n\n';
  
  if (options.includeMetadata) {
    markdown += `*Exported on ${new Date().toLocaleDateString()}*\n\n`;
    markdown += `---\n\n`;
  }

  // Write each date group
  messagesByDate.forEach((messages, date) => {
    markdown += `## ${date}\n\n`;
    
    messages.forEach(msg => {
      const senderName = getAgentName(state.agents, msg.sender);
      const time = formatTimestamp(msg.timestamp);
      const isUser = msg.sender === 'user';
      const isSystem = msg.sender === 'system';
      
      if (isSystem) {
        markdown += `> *System: ${msg.content}*\n\n`;
      } else {
        const prefix = isUser ? '👤' : '🤖';
        markdown += `### ${prefix} ${senderName} (${time})\n\n`;
        markdown += `${msg.content}\n\n`;
        markdown += `---\n\n`;
      }
    });
  });

  // Add agents section if requested
  if (options.includeMetadata && state.agents.length > 0) {
    markdown += `## Agents\n\n`;
    state.agents.forEach(agent => {
      markdown += `- **${agent.name}** (${agent.model})\n`;
    });
    markdown += '\n';
  }

  return markdown;
}

// Export to Plain Text
export function exportToText(state: ChatState, options: ExportOptions): string {
  const filteredMessages = filterMessages(state.messages, options);
  
  let text = 'AsterismChat Export\n';
  text += '='.repeat(50) + '\n\n';
  
  if (options.includeMetadata) {
    text += "Exported: " + new Date().toLocaleString() + "\n";
    text += "Session: " + state.sessionId + "\n";
    text += "Messages: " + filteredMessages.length + "\n";
    text += "\n" + "=".repeat(50) + "\n\n";
  }

  filteredMessages.forEach(msg => {
    const senderName = getAgentName(state.agents, msg.sender);
    const time = formatTimestamp(msg.timestamp);
    const date = formatDate(msg.timestamp);
    
    if (msg.sender === 'system') {
      text += `[${date} ${time}] System: ${msg.content}\n\n`;
    } else {
      text += `[${date} ${time}] ${senderName}: ${msg.content}\n\n`;
    }
  });

  return text;
}

// Main export function
export function exportChat(state: ChatState, options: ExportOptions): string {
  switch (options.format) {
    case 'json':
      return exportToJSON(state, options);
    case 'markdown':
      return exportToMarkdown(state, options);
    case 'text':
      return exportToText(state, options);
    default:
      throw new Error(`Unsupported export format: ${options.format}`);
  }
}

// Download helper
export function downloadExport(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Get MIME type for format
export function getMimeType(format: 'json' | 'markdown' | 'text'): string {
  switch (format) {
    case 'json':
      return 'application/json';
    case 'markdown':
      return 'text/markdown';
    case 'text':
      return 'text/plain';
  }
}

// Get file extension for format
export function getFileExtension(format: 'json' | 'markdown' | 'text'): string {
  switch (format) {
    case 'json':
      return 'json';
    case 'markdown':
      return 'md';
    case 'text':
      return 'txt';
  }
}