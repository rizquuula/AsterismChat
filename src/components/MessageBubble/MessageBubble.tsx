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
        <div className="px-4 py-2 dark:bg-gray-800 bg-gray-100 rounded-full border dark:border-gray-700 border-gray-200">
          <p className="text-[13px] dark:text-gray-400 text-gray-600 whitespace-pre-wrap">{message.content}</p>
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
            {!isUser && <span className="text-[13px] font-semibold dark:text-white text-gray-900">{message.senderName}</span>}
            <span className="text-[11px] dark:text-gray-500 text-gray-400">{formatTimestamp(message.timestamp)}</span>
          </div>
          <div className={`px-4 py-3 rounded-2xl ${isUser ? 'dark:bg-blue-500/20 bg-blue-50' : 'dark:bg-gray-800 bg-gray-100'} flex items-center gap-1`}>
            <span className="w-2 h-2 dark:bg-gray-400 bg-gray-500 rounded-full animate-bounce-dot" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 dark:bg-gray-400 bg-gray-500 rounded-full animate-bounce-dot" style={{ animationDelay: '160ms' }} />
            <span className="w-2 h-2 dark:bg-gray-400 bg-gray-500 rounded-full animate-bounce-dot" style={{ animationDelay: '320ms' }} />
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
            {!isUser && <span className="text-[13px] font-semibold dark:text-white text-gray-900">{message.senderName}</span>}
            <span className="text-[11px] dark:text-gray-500 text-gray-400">{formatTimestamp(message.timestamp)}</span>
          </div>
          <div className={`px-4 py-3 rounded-2xl dark:bg-red-500/20 bg-red-50 border dark:border-red-500/30 border-red-200`}>
            <div className="flex items-center gap-2 dark:text-red-400 text-red-600">
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

  return (
    <div className={`flex gap-3 mb-4 animate-fade-in-up ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && <Avatar name={message.senderName} size="sm" />}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[70%]`}>
        <div className={`flex items-center gap-2 mb-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          {!isUser && <span className="text-[13px] font-semibold dark:text-white text-gray-900">{message.senderName}</span>}
          <span className="text-[11px] dark:text-gray-500 text-gray-400">{formatTimestamp(message.timestamp)}</span>
        </div>
        <div className={`px-4 py-3 rounded-2xl ${isUser ? 'dark:bg-blue-500/20 bg-blue-50' : 'dark:bg-gray-800 bg-gray-100'}`}>
          <MarkdownRenderer content={message.content} />
        </div>
      </div>
    </div>
  );
}