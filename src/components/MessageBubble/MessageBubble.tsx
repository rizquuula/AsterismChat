import React from 'react';
import { Message } from '../../types';
import { Avatar } from '../common/Avatar';
import { MarkdownRenderer } from '../MarkdownRenderer/MarkdownRenderer';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  // System message (from /new command)
  if (isSystem) {
    return (
      <div className="flex justify-center mb-4">
        <div className="px-4 py-2 bg-[var(--bg-secondary)] rounded-full border border-[var(--border)]">
          <p className="text-[13px] text-[var(--text-secondary)] whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  const formatTimestamp = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (message.status === 'sending') {
    return (
      <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        {!isUser && <Avatar name={message.senderName} size="sm" />}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
          <div className="flex items-center gap-2 mb-1">
            {!isUser && <span className="text-[13px] font-semibold text-[var(--text-primary)]">{message.senderName}</span>}
            <span className="text-[11px] text-[var(--text-tertiary)]">{formatTimestamp(message.timestamp)}</span>
          </div>
          <div className={`px-4 py-3 rounded-2xl ${isUser ? 'bg-[var(--accent-primary)]/20' : 'bg-[var(--bg-secondary)]'} flex items-center gap-1`}>
            <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce-dot" style={{ animationDelay: '160ms' }} />
            <span className="w-2 h-2 bg-[var(--text-secondary)] rounded-full animate-bounce-dot" style={{ animationDelay: '320ms' }} />
          </div>
        </div>
      </div>
    );
  }

  if (message.status === 'error') {
    return (
      <div className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : ''}`}>
        {!isUser && <Avatar name={message.senderName} size="sm" />}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
          <div className="flex items-center gap-2 mb-1">
            {!isUser && <span className="text-[13px] font-semibold text-[var(--text-primary)]">{message.senderName}</span>}
            <span className="text-[11px] text-[var(--text-tertiary)]">{formatTimestamp(message.timestamp)}</span>
          </div>
          <div className={`px-4 py-3 rounded-2xl bg-[var(--accent-error)]/20 border border-[var(--accent-error)]/30`}>
            <div className="flex items-center gap-2 text-[var(--accent-error)]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-[14px]">{message.error || 'Failed to send message'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Format usage stats for display
  const formatUsage = (usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number }) => {
    if (!usage) return null;
    return `💰 ${usage.prompt_tokens} → ${usage.completion_tokens} (${usage.total_tokens} total)`;
  };

  return (
    <div className={`flex gap-3 mb-4 animate-fade-in-up ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && <Avatar name={message.senderName} size="sm" />}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          {!isUser && <span className="text-[13px] font-semibold text-[var(--text-primary)]">{message.senderName}</span>}
          <span className="text-[11px] text-[var(--text-tertiary)]">{formatTimestamp(message.timestamp)}</span>
        </div>
        <div className={`px-4 py-3 rounded-2xl ${isUser ? 'bg-[var(--accent-primary)]/20' : 'bg-[var(--bg-secondary)]'}`}>
          <MarkdownRenderer content={message.content} />
        </div>
        {!isUser && message.usage && (
          <div className="mt-1 text-[11px] text-[var(--text-tertiary)]">
            {formatUsage(message.usage)}
          </div>
        )}
      </div>
    </div>
  );
}
